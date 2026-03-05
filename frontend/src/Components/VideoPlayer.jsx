import React from "react";

// This is just the raw <video> element.
// All logic (Redux, events, capture) lives in pages/VideoPlayer.jsx
// which passes videoRef down if needed — for now this file is unused
// since pages/VideoPlayer.jsx renders <video> directly.

const VideoPlayer = ({ videoRef, src }) => {
  return (
    <video
      ref={videoRef}
      src={src || undefined}
      onContextMenu={(e) => e.preventDefault()}
      crossOrigin="anonymous"
      className="w-full"
    />
  );
};

export default VideoPlayer;