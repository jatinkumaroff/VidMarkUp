import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/store";
import {
  setCurrentTime, setDuration, setProgress,
  selectIsPlaying, selectVolume, selectIsMuted,
  selectSrc, selectVideoId, setSource, setVideoId, pause,
} from "../store/playerSlice";
import { setFullscreen, openModal } from "../store/uiSlice";
import { captureSuccess } from "../store/captureSlice";
import { setMarkersLocal, selectAllMarkers } from "../store/markersSlice";
import ControlPanel from "../Components/ControlPanel";
import Modal from "../Components/Modal";
import ViewModal from "../Components/ViewModal";

const VideoPlayer = () => {
  const dispatch  = useAppDispatch();
  const isPlaying = useAppSelector(selectIsPlaying);
  const volume    = useAppSelector(selectVolume);
  const isMuted   = useAppSelector(selectIsMuted);
  const src       = useAppSelector(selectSrc);
  const videoId   = useAppSelector(selectVideoId);
  const markers   = useAppSelector(selectAllMarkers);

  const videoRef     = useRef(null);
  const containerRef = useRef(null);

  const [editingMarker, setEditingMarker] = useState(null);
  const [viewMarker,    setViewMarker]    = useState(null);

  // ── Fetch videos on mount ─────────────────────────────────────
  useEffect(() => {
    fetch("/api/videos")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((videos) => {
        if (!videos?.length) return;
        dispatch(setVideoId(videos[0]._id));
        dispatch(setSource(videos[0].videoUrl));
      })
      .catch((err) => console.error("Failed to load videos:", err));
  }, [dispatch]);

  // ── Fetch markers whenever videoId changes ────────────────────
  const fetchMarkers = useCallback(() => {
    if (!videoId) return Promise.resolve([]);
    return fetch(`/api/markers?videoId=${videoId}`)
      .then((r) => r.json())
      .then((data) => {
        dispatch(setMarkersLocal(data));
        return data; // return fresh list for syncing local state
      })
      .catch((err) => { console.error("Failed to load markers:", err); return []; });
  }, [videoId, dispatch]);

  useEffect(() => { fetchMarkers(); }, [fetchMarkers]);

  // ── Controls fade ─────────────────────────────────────────────
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef(null);
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  // ── Sync Redux → video element ────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, [isPlaying]);

  useEffect(() => { if (videoRef.current) videoRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (videoRef.current) videoRef.current.muted  = isMuted; }, [isMuted]);

  useEffect(() => {
    const onChange = () => dispatch(setFullscreen(!!document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [dispatch]);

  // ── Seek ──────────────────────────────────────────────────────
  const seekTo = useCallback((time) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    dispatch(setCurrentTime(time));
  }, [dispatch]);

  // ── Fullscreen ────────────────────────────────────────────────
  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  // ── Capture frame + open create modal ────────────────────────
  const captureAndMark = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    dispatch(pause());

    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    dispatch(captureSuccess({
      url: dataUrl,
      time: video.currentTime,
      width: canvas.width,
      height: canvas.height,
    }));
    setEditingMarker(null);
    dispatch(openModal({ type: "whiteboard" }));
  }, [dispatch]);

  // ── Single click → ViewModal ──────────────────────────────────
  const handleMarkerClick = useCallback((marker) => {
    dispatch(pause());
    if (videoRef.current) videoRef.current.currentTime = marker.timestamp;
    dispatch(setCurrentTime(marker.timestamp));
    setViewMarker(marker);
  }, [dispatch]);

  // ── Double click → re-edit Modal ─────────────────────────────
  const handleMarkerEdit = useCallback((marker) => {
    dispatch(pause());
    if (videoRef.current) videoRef.current.currentTime = marker.timestamp;
    dispatch(setCurrentTime(marker.timestamp));
    setEditingMarker(marker);
    setViewMarker(null);
    dispatch(openModal({ type: "whiteboard" }));
  }, [dispatch]);

  // ── After save: refetch + sync local state with fresh data ────
  const handleSaveSuccess = useCallback(() => {
    fetchMarkers().then((freshMarkers) => {
      // If viewMarker is open, update it with the fresh version from server
      if (viewMarker) {
        const updated = freshMarkers.find((m) => m._id === viewMarker._id);
        if (updated) setViewMarker(updated);
      }
      // If editingMarker was just saved, update it too in case re-edit opens again
      if (editingMarker) {
        const updated = freshMarkers.find((m) => m._id === editingMarker._id);
        if (updated) setEditingMarker(updated);
      }
    });
  }, [fetchMarkers, viewMarker, editingMarker]);

  // ── Video events ──────────────────────────────────────────────
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    dispatch(setCurrentTime(v.currentTime));
    dispatch(setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0));
  };

  return (
    <div
      ref={containerRef}
      className="w-270 mx-auto relative border"
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
        className="w-full"
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

export default VideoPlayer;