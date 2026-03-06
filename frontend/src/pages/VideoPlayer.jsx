// src/pages/VideoPlayer.jsx
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  setCurrentTime, setDuration, setProgress,
  selectIsPlaying, selectVolume, selectIsMuted, selectSrc,
  setSource, setVideoId, pause,
} from "../store/playerSlice";
import { setFullscreen, openModal } from "../store/uiSlice";
import { captureSuccess }           from "../store/captureSlice";
import { setMarkersLocal, clearMarkers, selectAllMarkers } from "../store/markersSlice";
import ControlPanel from "../Components/ControlPanel";
import Modal        from "../Components/Modal";
import ViewModal    from "../Components/ViewModal";

const VideoPlayerPage = () => {
  // ── urlVideoId is the single source of truth — never use Redux videoId for fetching ──
  const { videoId: urlVideoId } = useParams();
  const dispatch  = useAppDispatch();
  const isPlaying = useAppSelector(selectIsPlaying);
  const volume    = useAppSelector(selectVolume);
  const isMuted   = useAppSelector(selectIsMuted);
  const src       = useAppSelector(selectSrc);
  const markers   = useAppSelector(selectAllMarkers);

  const videoRef     = useRef(null);
  const containerRef = useRef(null);

  const [editingMarker, setEditingMarker] = useState(null);
  const [viewMarker,    setViewMarker]    = useState(null);
  const [loadError,     setLoadError]     = useState(null);

  // ── When videoId URL param changes: clear stale state, fetch new video + markers ──
  useEffect(() => {
    if (!urlVideoId) return;

    // Immediately wipe previous video's markers so stale ones never show
    dispatch(clearMarkers());
    setLoadError(null);
    setEditingMarker(null);
    setViewMarker(null);

    // Fetch video details
    fetch(`https://vid-mark-up-backend.vercel.app/api/videos/${urlVideoId}`)
      .then((r) => { if (!r.ok) throw new Error(`Video not found (${r.status})`); return r.json(); })
      .then((video) => {
        dispatch(setVideoId(video._id));
        dispatch(setSource(video.videoUrl));
      })
      .catch((err) => { console.error(err); setLoadError(err.message); });

    // Fetch markers for THIS video using urlVideoId directly — not Redux state
    fetch(`/api/markers?videoId=${urlVideoId}`)
      .then((r) => r.json())
      .then((data) => dispatch(setMarkersLocal(Array.isArray(data) ? data : [])))
      .catch(console.error);

  }, [urlVideoId, dispatch]); // only re-runs when the URL video actually changes

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  // ── Sync Redux → video element ────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play().catch(() => {});
    else           videoRef.current.pause();
  }, [isPlaying]);

  useEffect(() => { if (videoRef.current) videoRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted  = isMuted; }, [isMuted]);

  useEffect(() => {
    const onChange = () => dispatch(setFullscreen(!!document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [dispatch]);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seekTo = useCallback((time) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    dispatch(setCurrentTime(time));
  }, [dispatch]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  // ── Capture frame ─────────────────────────────────────────────────────────
  const captureAndMark = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    dispatch(pause());
    const canvas  = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    dispatch(captureSuccess({
      url: canvas.toDataURL("image/jpeg", 0.95),
      time: video.currentTime,
      width: canvas.width,
      height: canvas.height,
    }));
    setEditingMarker(null);
    dispatch(openModal({ type: "whiteboard" }));
  }, [dispatch]);

  // ── Marker interactions ───────────────────────────────────────────────────
  const handleMarkerClick = useCallback((marker) => {
    dispatch(pause());
    if (videoRef.current) videoRef.current.currentTime = marker.timestamp;
    dispatch(setCurrentTime(marker.timestamp));
    setViewMarker(marker);
  }, [dispatch]);

  const handleMarkerEdit = useCallback((marker) => {
    dispatch(pause());
    if (videoRef.current) videoRef.current.currentTime = marker.timestamp;
    dispatch(setCurrentTime(marker.timestamp));
    setEditingMarker(marker);
    setViewMarker(null);
    dispatch(openModal({ type: "whiteboard" }));
  }, [dispatch]);

  // ── Refetch markers after save/delete — use urlVideoId, not Redux ─────────
  const handleSaveSuccess = useCallback(() => {
    if (!urlVideoId) return;
    fetch(`/api/markers?videoId=${urlVideoId}`)
      .then((r) => r.json())
      .then((data) => dispatch(setMarkersLocal(Array.isArray(data) ? data : [])))
      .catch(console.error);
    setEditingMarker(null);
    setViewMarker(null);
  }, [urlVideoId, dispatch]);

  // ── Video events ──────────────────────────────────────────────────────────
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    dispatch(setCurrentTime(v.currentTime));
    dispatch(setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0));
  };

  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-white gap-4 bg-[#222222]">
        <p className="text-5xl">⚠️</p>
        <p className="text-xl font-semibold">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-start justify-center p-4 bg-[#222222]">
      <div
        ref={containerRef}
        className="w-full max-w-7xl relative rounded-lg overflow-hidden border border-[#2a2a2a]"
        onMouseMove={resetHideTimer}
        onMouseLeave={() => { clearTimeout(hideTimer.current); setShowControls(false); }}
      >
        <video
          key={src}                         
          ref={videoRef}
          src={src || undefined}
          onContextMenu={(e) => e.preventDefault()}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current) dispatch(setDuration(videoRef.current.duration));
          }}
          crossOrigin="anonymous"
          className="w-full block bg-black"
        />

        <div className="h-[85%] w-full absolute top-0" />

        <div
          className="absolute bottom-0 w-full transition-opacity duration-300"
          style={{ opacity: showControls ? 1 : 0, pointerEvents: showControls ? "auto" : "none" }}
        >
          <ControlPanel
            seekTo={seekTo}
            toggleFS={toggleFS}
            captureAndMark={captureAndMark}
            markers={markers}
            onMarkerClick={handleMarkerClick}
            onMarkerEdit={handleMarkerEdit}
          />
        </div>
      </div>

      <Modal
        editingMarker={editingMarker}
        onSaveSuccess={handleSaveSuccess}
        onDeleteSuccess={handleSaveSuccess}
      />

      {viewMarker && (
        <ViewModal
          marker={viewMarker}
          onClose={() => setViewMarker(null)}
          onEdit={() => { handleMarkerEdit(viewMarker); setViewMarker(null); }}
          onDeleteSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default VideoPlayerPage;