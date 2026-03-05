import React, { useRef, useState, useCallback } from "react";
import { Tldraw, AssetRecordType, createShapeId, getSnapshot, loadSnapshot } from "tldraw";
import "tldraw/tldraw.css";
import { useAppDispatch, useAppSelector } from "../store/store";
import { selectIsModalOpen, closeModal } from "../store/uiSlice";
import { selectFrameUrl, selectFrameTime, selectFrameWidth, selectFrameHeight, clearCapture } from "../store/captureSlice";
import { selectVideoId } from "../store/playerSlice";

const Modal = ({ editingMarker, onSaveSuccess, onDeleteSuccess }) => {
  const dispatch    = useAppDispatch();
  const isOpen      = useAppSelector(selectIsModalOpen);
  const frameUrl    = useAppSelector(selectFrameUrl);
  const frameTime   = useAppSelector(selectFrameTime);
  const frameWidth  = useAppSelector(selectFrameWidth);
  const frameHeight = useAppSelector(selectFrameHeight);
  const videoId     = useAppSelector(selectVideoId);

  const editorRef   = useRef(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const isEditMode = !!editingMarker;

  const loadImageAsBackground = (editor, src, w, h) => {
    const assetId = AssetRecordType.createId();
    const shapeId = createShapeId("frame");

    editor.createAssets([{
      id: assetId, typeName: "asset", type: "image", meta: {},
      props: { w, h, src, name: "Video Frame", isAnimated: false, mimeType: "image/jpeg" },
    }]);

    editor.createShape({
      id: shapeId, type: "image", x: 0, y: 0, isLocked: true,
      props: { w, h, assetId },
    });

    editor.setCameraOptions({
      constraints: {
        bounds: { x: -(w * 2), y: -(h * 2), w: w * 5, h: h * 5 },
        padding: { x: 0, y: 0 }, behavior: "contain",
        initialZoom: "default", baseZoom: "default", origin: { x: 0.5, y: 0.5 },
      },
    });

    editor.setCamera(editor.getCamera(), { reset: true });
    editor.clearHistory();
  };

  const handleMount = useCallback((editor) => {
    editorRef.current = editor;

    if (isEditMode) {
      const rawSrc = editingMarker.assets.rawImageHr + "?v=" + editingMarker.updatedAt;
      const img = new Image();

      img.onload = () => {
        const w = img.naturalWidth  || 1280;
        const h = img.naturalHeight || 720;
        setTimeout(() => {
          if (editingMarker.assets?.annotations) {
            try {
              loadSnapshot(editor.store, editingMarker.assets.annotations);
              editor.zoomToFit({ animation: { duration: 0 } });
              editor.clearHistory();
              return;
            } catch (e) {
              console.warn("loadSnapshot failed, falling back:", e);
            }
          }
          loadImageAsBackground(editor, rawSrc, w, h);
        }, 100);
      };

      img.onerror = () => {
        setTimeout(() => {
          if (editingMarker.assets?.annotations) {
            try {
              loadSnapshot(editor.store, editingMarker.assets.annotations);
              editor.zoomToFit({ animation: { duration: 0 } });
              editor.clearHistory();
            } catch (e) {
              console.error("Failed to restore annotation:", e);
            }
          }
        }, 100);
      };

      img.src = rawSrc;
      return;
    }

    if (!frameUrl || !frameWidth || !frameHeight) return;
    loadImageAsBackground(editor, frameUrl, frameWidth, frameHeight);
  }, [isEditMode, editingMarker, frameUrl, frameWidth, frameHeight]);

  const cleanup = () => {
    dispatch(clearCapture());
    dispatch(closeModal());
    setConfirming(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/markers/" + editingMarker._id, { method: "DELETE" });
      if (!res.ok) throw new Error("Server responded " + res.status);
      onDeleteSuccess?.();
      cleanup();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleSave = async () => {
    const editor = editorRef.current;
    if (!editor) { setError("Editor not ready."); return; }
    if (!isEditMode && !videoId) { setError("No videoId."); return; }

    setSaving(true);
    setError(null);

    try {
      const ids = [...editor.getCurrentPageShapeIds()];
      const rawBlob = isEditMode ? null : await fetch(frameUrl).then((r) => r.blob());
      const { blob: mergedBlobHr }  = await editor.toImage(ids, { format: "png", background: true });
      const { blob: previewBlobLr } = await editor.toImage(ids, { format: "png", background: true, scale: 0.25 });
      const annotations = getSnapshot(editor.store);

      const formData = new FormData();
      formData.append("annotations",  JSON.stringify(annotations));
      if (rawBlob) formData.append("rawImageHr",     rawBlob,       "raw.jpg");
      formData.append("mergedImageHr",  mergedBlobHr,  "merged.png");
      formData.append("previewImageLr", previewBlobLr, "preview.png");

      let res;
      if (isEditMode) {
        formData.append("timestamp", String(editingMarker.timestamp));
        res = await fetch("/api/markers/" + editingMarker._id, { method: "PUT", body: formData });
      } else {
        formData.append("videoId",   videoId);
        formData.append("timestamp", String(frameTime));
        res = await fetch("/api/markers", { method: "POST", body: formData });
      }

      if (!res.ok) throw new Error("Server responded " + res.status);
      onSaveSuccess?.();
      cleanup();
    } catch (err) {
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

        <div className="bg-[#1a1a1a] text-white text-xs px-4 py-1.5 flex items-center gap-2 shrink-0">
          <span className={"w-2 h-2 rounded-full " + (isEditMode ? "bg-yellow-400" : "bg-green-400")} />
          {isEditMode ? "Re-editing — Save will replace existing" : "New annotation"}
        </div>

        <div className="flex-1 min-h-0">
          <Tldraw onMount={handleMount} />
        </div>

        {error && <div className="px-4 py-2 bg-red-100 text-red-700 text-xs shrink-0">{error}</div>}

        <div className="flex flex-row items-center justify-between gap-4 bg-white px-6 py-3 text-sm font-semibold shrink-0">

          {/* Delete — only in edit mode, left side */}
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
                <span className="text-gray-800 text-sm font-semibold">Really delete this annotation?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
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

          {/* Save / Cancel — right side */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-1 bg-[#ffa600] text-black rounded hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
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