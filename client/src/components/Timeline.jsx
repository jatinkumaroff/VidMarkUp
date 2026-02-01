import React, { useState, useRef } from 'react';

const Timeline = ({ currentTime, duration, annotations, onSeek, onMarkerClick }) => {
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const timelineRef = useRef(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getMarkerPosition = (timestamp_ms) => {
    if (!duration) return 0;
    return (timestamp_ms / (duration * 1000)) * 100;
  };

  return (
    <div className="relative">
      {/* Progress bar */}
      <div
        ref={timelineRef}
        className="h-2 bg-gray-300 rounded-full cursor-pointer relative group"
        onClick={onSeek}
        role="slider"
        aria-label="Video progress"
        aria-valuemin="0"
        aria-valuemax={duration}
        aria-valuenow={currentTime}
      >
        {/* Progress fill */}
        <div
          className="h-full bg-blue-600 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Current time indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-lg -ml-2"
          style={{ left: `${progress}%` }}
        />

        {/* Annotation markers */}
        {annotations.map((annotation) => {
          const position = getMarkerPosition(annotation.timestamp_ms);
          const isHovered = hoveredMarker === annotation.id;

          return (
            <div
              key={annotation.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              {/* Marker dot */}
              <div
                className="w-3 h-3 bg-green-500 rounded-full cursor-pointer hover:scale-150 transition-transform shadow-md border-2 border-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkerClick(annotation);
                }}
                onMouseEnter={() => setHoveredMarker(annotation.id)}
                onMouseLeave={() => setHoveredMarker(null)}
                aria-label={`Annotation at ${annotation.timecode}`}
              />

              {/* Hover tooltip with thumbnail */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <div className="bg-white rounded-lg shadow-xl p-2 border border-gray-200 min-w-[200px]">
                    <img
                      src={annotation.thumb_path}
                      alt="Annotation thumbnail"
                      className="w-full h-auto rounded mb-2"
                    />
                    <div className="text-xs text-gray-600">
                      <div className="font-semibold">{annotation.timecode}</div>
                      {annotation.notes && (
                        <div className="mt-1 text-gray-500 truncate">
                          {annotation.notes}
                        </div>
                      )}
                      <div className="mt-1 text-gray-400">
                        {new Date(annotation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-8 border-transparent border-t-white" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
