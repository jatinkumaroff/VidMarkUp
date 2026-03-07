import React, { useRef, useState, useCallback } from "react";
import {
  Tldraw,
  AssetRecordType,
  createShapeId,
  getSnapshot,
  loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import { useAppDispatch, useAppSelector } from "../store/store";
import { selectIsModalOpen, closeModal } from "../store/uiSlice";
import {
  selectFrameUrl,
  selectFrameTime,
  selectFrameWidth,
  selectFrameHeight,
  clearCapture,
} from "../store/captureSlice";
import { selectVideoId } from "../store/playerSlice";

// The background frame shape always gets this fixed ID so we can reliably strip
// it from the snapshot before saving (avoids storing huge base64 in MongoDB).
const BG_SHAPE_ID = createShapeId("bg-frame");

const Modal = ({ editingMarker, onSaveSuccess, onDeleteSuccess }) => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsModalOpen);
  const frameUrl = useAppSelector(selectFrameUrl);
  const frameTime = useAppSelector(selectFrameTime);
  const frameWidth = useAppSelector(selectFrameWidth);
  const frameHeight = useAppSelector(selectFrameHeight);
  const videoId = useAppSelector(selectVideoId);

  const editorRef = useRef(null);
  const bgAssetIdRef = useRef(null); // track the background asset ID so we can strip it

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditMode = !!editingMarker;

  // ── Load an image as a locked background shape ──────────────────────────────
  const loadImageAsBackground = useCallback((editor, src, w, h) => {
    const assetId = AssetRecordType.createId();
    bgAssetIdRef.current = assetId;

    editor.createAssets([
      {
        id: assetId,
        typeName: "asset",
        type: "image",
        meta: {},
        props: {
          w,
          h,
          src,
          name: "frame",
          isAnimated: false,
          mimeType: "image/jpeg",
          fileSize: Math.max(1, Math.round((src.length * 3) / 4)), // real byte estimate
        },
      },
    ]);

    editor.createShape({
      id: BG_SHAPE_ID,
      type: "image",
      x: 0,
      y: 0,
      isLocked: true,
      props: { w, h, assetId },
    });

    // Scroll bounds: allow 25% of frame on each side, no more
    const padX = w * 0.25;
    const padY = h * 0.25;
    editor.setCameraOptions({
      constraints: {
        bounds: { x: -padX, y: -padY, w: w + padX * 2, h: h + padY * 2 },
        padding: { x: 0.1, y: 0.1 }, // 10% viewport margin when fitting
        behavior: "contain",
        initialZoom: "fit-max", // zoom to fit with padding on open
        baseZoom: "fit-max",
        origin: { x: 0.5, y: 0.5 },
      },
    });
    // Reset camera AFTER constraints so it zooms to fit with the margin
    editor.setCamera({ x: 0, y: 0, z: 1 }, { reset: true });
    editor.clearHistory();
  }, []);

  // ── Merge saved annotation shapes back into the store ──────────────────────
  // We purposely do NOT use loadSnapshot() here because that would wipe the
  // background shape we just added. Instead, we put only shape/asset records.
  const mergeAnnotationsIntoStore = useCallback((editor, annotations) => {
    if (!annotations?.document?.store) return;
    try {
      const records = Object.values(annotations.document.store);

      const sanitize = (r) => {
        // tldraw v4 requires meta to be a plain object, never undefined/null
        const meta = r.meta && typeof r.meta === "object" ? r.meta : {};
        // props may also contain meta sub-fields on some shape types
        let props = r.props;
        if (props && typeof props === "object") {
          props = { ...props };
          if (
            props.meta !== undefined &&
            (props.meta === null || typeof props.meta !== "object")
          ) {
            props.meta = {};
          }
        }
        return { ...r, meta, ...(props !== r.props ? { props } : {}) };
      };

      const toRestore = records
        .filter(
          (r) =>
            // Skip background shape — we already placed ours
            (r.typeName === "shape" && r.id !== BG_SHAPE_ID) ||
            r.typeName === "asset",
        )
        .map(sanitize);

      if (toRestore.length > 0) {
        editor.store.put(toRestore);
      }
    } catch (e) {
      console.warn("mergeAnnotationsIntoStore failed:", e);
    }
  }, []);

  // ── onMount ────────────────────────────────────────────────────────────────
  const handleMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      if (isEditMode) {
        // rawSrc is the permanent R2 URL — no base64, no CORS issues during export
        const rawSrc =
          editingMarker.assets.rawImageHr + "?v=" + editingMarker.updatedAt;

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
          const w = img.naturalWidth || 1280;
          const h = img.naturalHeight || 720;

          setTimeout(() => {
            // 1. Add background from the permanent rawImageHr URL
            loadImageAsBackground(editor, rawSrc, w, h);

            // 2. Merge saved annotation shapes on top (background excluded)
            if (editingMarker.assets?.annotations) {
              mergeAnnotationsIntoStore(
                editor,
                editingMarker.assets.annotations,
              );
            }

            editor.clearHistory();
          }, 120);
        };

        img.onerror = () => {
          // Image failed to load (e.g. CORS) — still load whatever annotations we have
          console.warn(
            "Background image failed to load, annotations-only mode",
          );
          setTimeout(() => {
            if (editingMarker.assets?.annotations) {
              try {
                // Fall back to full loadSnapshot so at least the annotations show
                loadSnapshot(editor.store, editingMarker.assets.annotations);
                editor.clearHistory();
              } catch (e) {
                console.error("loadSnapshot fallback failed:", e);
              }
            }
          }, 120);
        };

        img.src = rawSrc;
        return;
      }

      // ── CREATE mode ──────────────────────────────────────────────────────────
      if (!frameUrl || !frameWidth || !frameHeight) return;
      loadImageAsBackground(editor, frameUrl, frameWidth, frameHeight);
    },
    [
      isEditMode,
      editingMarker,
      frameUrl,
      frameWidth,
      frameHeight,
      loadImageAsBackground,
      mergeAnnotationsIntoStore,
    ],
  );

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = () => {
    bgAssetIdRef.current = null;
    dispatch(clearCapture());
    dispatch(closeModal());
    setConfirming(false);
    setError(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        "https://vid-mark-up-backend.vercel.app/api/markers/" +
          editingMarker._id,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Server responded " + res.status);
      onDeleteSuccess?.();
      cleanup();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const editor = editorRef.current;
    if (!editor) {
      setError("Editor not ready.");
      return;
    }
    if (!isEditMode && !videoId) {
      setError("No videoId.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const ids = [...editor.getCurrentPageShapeIds()];
      if (ids.length === 0) {
        setError("Nothing to save.");
        setSaving(false);
        return;
      }

      // ── Generate export images ────────────────────────────────────────────
      const rawBlob = isEditMode
        ? null
        : await fetch(frameUrl).then((r) => r.blob());

      const { blob: mergedBlobHr } = await editor.toImage(ids, {
        format: "png",
        background: true,
      });
      const { blob: previewBlobLr } = await editor.toImage(ids, {
        format: "png",
        background: true,
        scale: 0.25,
      });

      // ── Build a CLEAN snapshot (strip background shape + its asset) ────────
      // This is the critical fix: the raw snapshot contains the full base64
      // data URL of the video frame (~2-8 MB), which would make the request
      // body far exceed Vercel's serverless limit and MongoDB's document limit.
      // We store rawImageHr separately, so it's safe to remove it here.
      const rawSnapshot = getSnapshot(editor.store);
      const bgAssetId = bgAssetIdRef.current;

      const cleanedStore = Object.fromEntries(
        Object.entries(rawSnapshot.document.store).filter(
          ([id]) => id !== BG_SHAPE_ID && id !== bgAssetId,
        ),
      );

      const annotations = {
        ...rawSnapshot,
        document: { ...rawSnapshot.document, store: cleanedStore },
      };

      // ── Build FormData ────────────────────────────────────────────────────
      const formData = new FormData();
      formData.append("annotations", JSON.stringify(annotations));
      if (rawBlob) formData.append("rawImageHr", rawBlob, "raw.jpg");
      formData.append("mergedImageHr", mergedBlobHr, "merged.png");
      formData.append("previewImageLr", previewBlobLr, "preview.png");

      let res;
      if (isEditMode) {
        formData.append("timestamp", String(editingMarker.timestamp));
        res = await fetch(
          "https://vid-mark-up-backend.vercel.app/api/markers/" +
            editingMarker._id,
          { method: "PUT", body: formData },
        );
      } else {
        formData.append("videoId", videoId);
        formData.append("timestamp", String(frameTime));
        res = await fetch(
          "https://vid-mark-up-backend.vercel.app/api/markers",
          { method: "POST", body: formData },
        );
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Server ${res.status}${body ? ": " + body : ""}`);
      }

      onSaveSuccess?.();
      cleanup();
    } catch (err) {
      console.error("handleSave error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  if (!isEditMode && !frameUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="h-[92vh] w-[92vw] flex flex-col rounded-lg overflow-hidden shadow-2xl">
        {/* Status bar */}
        <div className="bg-[#1a1a1a] text-white text-xs px-4 py-1.5 flex items-center gap-2 shrink-0">
          <span
            className={
              "w-2 h-2 rounded-full " +
              (isEditMode ? "bg-yellow-400" : "bg-green-400")
            }
          />
          {isEditMode ? "Re-editing annotation" : "New annotation"}
        </div>

        {/* Canvas */}
        <div className="flex-1 min-h-0">
          <Tldraw onMount={handleMount} />
        </div>

        {/* Error bar */}
        {error && (
          <div className="px-4 py-2 bg-red-100 text-red-700 text-xs shrink-0">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-row items-center justify-between gap-4 bg-white px-6 py-3 text-sm font-semibold shrink-0">
          {/* Delete (edit mode only) */}
          <div>
            {isEditMode && !confirming && (
              <button
                onClick={() => setConfirming(true)}
                disabled={saving || deleting}
                className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold disabled:opacity-50"
              >
                Delete
              </button>
            )}
            {isEditMode && confirming && (
              <div className="flex items-center gap-3">
                <span className="text-gray-800 text-sm font-semibold">
                  Really delete?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="px-4 py-1 border border-gray-400 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-1 bg-[#ffa600] text-black rounded hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditMode ? "Update" : "Save"}
            </button>
            <button
              onClick={cleanup}
              disabled={saving || deleting}
              className="px-4 py-1 bg-[#292929] text-white rounded hover:brightness-125 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
