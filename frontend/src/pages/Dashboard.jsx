// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://vid-mark-up-backend.vercel.app";

const uploadToPresignedUrl = (presignedUrl, file) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () =>
      xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });

// ─── Upload Modal ─────────────────────────────────────────────────────────────
const UploadModal = ({ onClose, onUploaded }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const thumbRef = useRef(null);

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Title is required");
    if (!file) return setError("Please select a video file");
    
    setUploading(true);
    setError(null);

    try {
      let finalVideoUrl = null;
      let finalThumbnailUrl = null;

      const presignRes = await fetch(`${API}/api/videos/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          filename: file.name,
          contentType: file.type || "video/mp4",
          ...(thumbFile && {
            thumbFilename: thumbFile.name,
            thumbContentType: thumbFile.type || "image/jpeg",
          }),
        }),
      });

      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(
          body.error || `Presign failed (${presignRes.status})`,
        );
      }

      const {
        videoUploadUrl,
        videoUrl: publicVideoUrl,
        thumbUploadUrl,
        thumbnailUrl,
      } = await presignRes.json();

      await uploadToPresignedUrl(videoUploadUrl, file);
      finalVideoUrl = publicVideoUrl;

      if (thumbFile && thumbUploadUrl) {
        await uploadToPresignedUrl(thumbUploadUrl, thumbFile);
        finalThumbnailUrl = thumbnailUrl;
      }

      const saveRes = await fetch(`${API}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          videoUrl: finalVideoUrl,
          thumbnailUrl: finalThumbnailUrl,
        }),
      });

      if (!saveRes.ok) {
        const body = await saveRes.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${saveRes.status})`);
      }

      const video = await saveRes.json();
      onUploaded(video);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Upload Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Video Title"
          className="w-full bg-[#111] border border-[#2a2a2a] focus:border-[#ffa600] rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 outline-none transition-colors mb-4"
        />

        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Video File
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[#333] hover:border-[#ffa600] rounded-xl p-5 text-center cursor-pointer transition-colors group mb-3"
        >
          {file ? (
            <div>
              <p className="text-sm font-semibold text-[#ffa600] truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                🎬
              </p>
              <p className="text-sm text-gray-400">Click to select video</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files[0]);
            }}
          />
        </div>

        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
          Thumbnail{" "}
          <span className="normal-case font-normal text-gray-600">
           
          </span>
        </label>
        <div
          onClick={() => thumbRef.current?.click()}
          className="w-full border border-dashed border-[#2a2a2a] hover:border-[#555] rounded-xl p-3 text-center cursor-pointer transition-colors group mb-5"
        >
          {thumbFile ? (
            <p className="text-xs text-gray-300 truncate">{thumbFile.name}</p>
          ) : (
            <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
              Click to upload a thumbnail
            </p>
          )}
          <input
            ref={thumbRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setThumbFile(e.target.files[0])}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 border border-[#333] rounded-lg text-sm text-gray-300 hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 py-2.5 bg-[#ffa600] text-black font-bold rounded-lg text-sm hover:bg-[#ffb733] transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Video Card ───────────────────────────────────────────────────────────────
const VideoCard = ({ video, onClick, onDelete }) => {
  const [thumbSrc, setThumbSrc] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (video.thumbnailUrl) {
      setThumbSrc(video.thumbnailUrl);
      return;
    }
    if (!video.videoUrl) return;
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.src = video.videoUrl;
    vid.currentTime = 2;
    vid.onloadeddata = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 180;
        c.getContext("2d").drawImage(vid, 0, 0, 320, 180);
        setThumbSrc(c.toDataURL("image/jpeg", 0.75));
      } catch {}
    };
  }, [video.videoUrl, video.thumbnailUrl]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/videos/${video._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("failed");
      onDelete(video._id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  const dateStr = video.createdAt
    ? new Date(video.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div
      onClick={() => onClick(video._id)}
      className="group relative bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#ffa600]/50 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(255,166,0,0.1)]"
    >
      <div className="relative aspect-video bg-[#111] overflow-hidden">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#444] text-3xl select-none">
            ▶
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 bg-[#ffa600] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-black text-base ml-0.5">▶</span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate">
          {video.title}
        </p>
        {dateStr && <p className="text-gray-500 text-xs mt-0.5">{dateStr}</p>}
      </div>
      <div
        className="absolute top-2 right-2"
        onClick={(e) => e.stopPropagation()}
      >
        {!confirming ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
            className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-black/70 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center transition-all"
          >
            ✕
          </button>
        ) : (
          <div className="flex gap-1 items-center bg-black/90 border border-red-800 rounded-lg px-2 py-1.5">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-300 text-xs font-bold disabled:opacity-50"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <span className="text-gray-600 text-xs">|</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(false);
              }}
              className="text-gray-400 hover:text-white text-xs"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/videos`)
      .then((r) => r.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen w-full text-white px-8 py-6 bg-[#222222]">
      <div className="flex items-center gap-4 mb-7">
        <h1 className="text-2xl font-bold shrink-0">Video Library</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="ml-auto flex items-center gap-2 bg-[#ffa600] hover:bg-[#ffb733] text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
        >
          <span className="text-lg leading-none">+</span> Upload Video
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[#ffa600] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-5xl mb-3">🎬</p>
          <p className="text-gray-300 text-xl font-semibold mb-2">
            No videos yet
          </p>
          <p className="text-gray-500 text-sm mb-5">
            Upload a video to start annotating
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-[#ffa600] text-black font-bold px-5 py-2 rounded-lg hover:bg-[#ffb733] transition-colors text-sm"
          >
            Upload Video
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600 text-xs mb-4">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onClick={(id) => navigate(`/player/${id}`)}
                onDelete={(id) =>
                  setVideos((prev) => prev.filter((v) => v._id !== id))
                }
              />
            ))}
          </div>
        </>
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={(v) => setVideos((prev) => [v, ...prev])}
        />
      )}
    </div>
  );
};

export default Dashboard;
