// src/pages/Notes.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://vid-mark-up-backend.vercel.app";

// ── Auto-generate a thumbnail from the video URL by seeking to t=2s ──────────
const AutoThumb = ({ videoUrl, title }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!videoUrl) return;
    const vid = document.createElement("video");
    vid.crossOrigin = "anonymous";
    vid.src = videoUrl;
    vid.currentTime = 2;
    vid.onloadeddata = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 480; c.height = 270;
        c.getContext("2d").drawImage(vid, 0, 0, 480, 270);
        setSrc(c.toDataURL("image/jpeg", 0.8));
      } catch {}
    };
  }, [videoUrl]);

  if (src) {
    return <img src={src} alt={title} className="w-full h-full object-cover" />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#111] text-[#444] text-4xl select-none">
      ▶
    </div>
  );
};

// ── Single video note card ────────────────────────────────────────────────────
const NoteCard = ({ video, onClick }) => {
  const markerCount = video.markerCount ?? 0;

  return (
    <div
      onClick={() => onClick(video._id)}
      className="group h-55 mb-5 transform-gpu transition-transform duration-300 ease-out hover:scale-105 hover:z-10 cursor-pointer"
    >
      {/* Thumbnail area — matches original Thumbnails component proportions */}
      <div className="w-full rounded-lg overflow-hidden relative aspect-video bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#ffa600]/40 transition-colors shadow-lg">

        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <AutoThumb videoUrl={video.videoUrl} title={video.title} />
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-[#ffa600] rounded-full flex items-center justify-center shadow-xl">
            <span className="text-black text-lg ml-0.5">▶</span>
          </div>
        </div>

        {/* Marker count badge — bottom-right corner */}
        <div className="absolute bottom-2 right-2">
          <div className={`
            flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg
            ${markerCount > 0
              ? "bg-[#ffa600] text-black"
              : "bg-black/60 text-gray-400 border border-[#333]"}
          `}>
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="7" rx="1" />
              <rect x="3" y="9.5" width="6" height="1.5" rx="0.75" />
            </svg>
            {markerCount === 0
              ? "No pages"
              : `${markerCount} page${markerCount !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {/* Title */}
      <p className="text-[#e6e6e6] px-1 pt-2 pb-0 text-sm text-center truncate leading-snug">
        {video.title}
      </p>
    </div>
  );
};

// ── Notes page ────────────────────────────────────────────────────────────────
const Notes = () => {
  const navigate = useNavigate();
  const [videos,  setVideos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    fetch(`${API}/api/videos/summary`)
      .then((r) => { if (!r.ok) throw new Error(`Server error ${r.status}`); return r.json(); })
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = videos.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-h-full bg-[#222222] px-[5%] pt-8 pb-16">

      {/* ── Page header ── */}
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-white text-2xl font-bold leading-tight">Notes</h1>
          {!loading && !error && (
            <p className="text-[#a0a0a0] text-xs mt-0.5">
              {filtered.length} video{filtered.length !== 1 ? "s" : ""}
              {filtered.length > 0 && (
                <> · {filtered.reduce((s, v) => s + (v.markerCount ?? 0), 0)} total pages</>
              )}
            </p>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search videos…"
          className="ml-auto max-w-xs w-full bg-[#2a2a2a] border border-[#3a3a3a] focus:border-[#ffa600] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
        />
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-2 border-[#ffa600] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-3">
          <p className="text-3xl">⚠️</p>
          <p className="text-[#a0a0a0] text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetch(`${API}/api/videos/summary`).then(r=>r.json()).then(setVideos).catch(e=>setError(e.message)).finally(()=>setLoading(false)); }}
            className="px-4 py-2 bg-[#ffa600] text-black text-sm font-bold rounded-lg hover:bg-[#ffb733] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-2">
          {search ? (
            <>
              <p className="text-3xl mb-1">🔍</p>
              <p className="text-[#a0a0a0] text-sm">No videos match "{search}"</p>
            </>
          ) : (
            <>
              <p className="text-4xl mb-2">🎬</p>
              <p className="text-white text-lg font-semibold">No videos yet</p>
              <p className="text-[#a0a0a0] text-sm">Upload videos from the Dashboard to see them here</p>
              <button
                onClick={() => navigate("/")}
                className="mt-3 px-4 py-2 bg-[#ffa600] text-black text-sm font-bold rounded-lg hover:bg-[#ffb733] transition-colors"
              >
                Go to Dashboard
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Grid — matches original flex-wrap layout from Notes ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-wrap gap-6 justify-start">
          {filtered.map((video) => (
            <div key={video._id} className="w-[calc(20%-1.2rem)] min-w-[160px]">
              <NoteCard
                video={video}
                onClick={(id) => navigate(`/player/${id}`)}
              />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Notes;