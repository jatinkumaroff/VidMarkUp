import React, { useRef, useState, useEffect } from "react";
import { useAppSelector } from "../store/store";
import { selectProgress, selectDuration } from "../store/playerSlice";

const preloadImage = (url) => {
  if (!url) return;
  const img = new Image();
  img.src = url;
};

const Timeline = ({ seekTo, markers = [], onMarkerClick, onMarkerEdit }) => {
  const progress = useAppSelector(selectProgress);
  const duration = useAppSelector(selectDuration);
  const barRef   = useRef(null);
  const dragging = useRef(false);

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const hideTimer  = useRef(null);
  const clickTimer = useRef(null);

  useEffect(() => {
    markers.forEach((m) => {
      if (m.assets?.previewImageLr) {
        preloadImage(m.assets.previewImageLr + "?v=" + m.updatedAt);
      }
    });
  }, [markers]);

  const calcTime = (clientX) => {
    const rect  = barRef.current.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return ratio * duration;
  };

  const handleMouseDown = (e) => {
    dragging.current = true;
    seekTo(calcTime(e.clientX));
    const onMove = (e) => { if (dragging.current) seekTo(calcTime(e.clientX)); };
    const onUp   = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const enterMarker = (idx) => { clearTimeout(hideTimer.current); setHoveredIdx(idx); };
  const leaveMarker = () => { hideTimer.current = setTimeout(() => setHoveredIdx(null), 300); };

  const handleClick = (marker, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onMarkerEdit?.(marker);
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        onMarkerClick?.(marker);
      }, 250);
    }
  };

  return (
    <div className="py-2">
      <div
        ref={barRef}
        className="h-2 bg-gray-500 rounded-lg relative cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        <div
          className="bg-red-500 h-full rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <button className="h-4 w-4 rounded-full bg-red-600 absolute -right-2.5 -bottom-1 cursor-grab active:cursor-grabbing" />
        </div>

        {duration > 0 && markers.map((marker, idx) => {
          const pct       = (marker.timestamp / duration) * 100;
          const isHovered = hoveredIdx === idx;
          const previewSrc = marker.assets?.previewImageLr
            ? marker.assets.previewImageLr + "?v=" + marker.updatedAt
            : null;

          return (
            <div
              key={marker._id || idx}
              className="absolute bottom-0 flex flex-col items-center z-20"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
              onMouseEnter={() => enterMarker(idx)}
              onMouseLeave={leaveMarker}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <div
                className={`absolute bottom-5 pb-2 transition-all duration-200 ${
                  isHovered
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-1 pointer-events-none"
                }`}
                onMouseEnter={() => enterMarker(idx)}
                onMouseLeave={leaveMarker}
                onClick={(e) => handleClick(marker, e)}
              >
                <div className="w-48 rounded-md border-2 border-yellow-400 overflow-hidden shadow-xl bg-black cursor-pointer group relative">
                  {previewSrc ? (
                    <>
                      <img
                        src={previewSrc}
                        alt="marker preview"
                        className="w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold drop-shadow">
                          click / dbl-click to edit
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="h-20 flex items-center justify-center text-gray-400 text-xs">
                      No preview
                    </div>
                  )}
                </div>
              </div>

              <button
                className="h-3 w-3 rounded-full bg-yellow-400 border border-yellow-600 hover:scale-125 transition-transform duration-150 shadow"
                onClick={(e) => handleClick(marker, e)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;