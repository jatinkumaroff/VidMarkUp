import React, { useState, useRef, useEffect } from 'react';
import AnnotationEditor from './AnnotationEditor';
import AnnotationEditorTldraw from './AnnotationEditorTldraw';
import AnnotationViewer from './AnnotationViewer';
import Timeline from './Timeline';

const VideoPlayer = ({ videoId, videoUrl, annotations, onAnnotationCreated, onAnnotationDeleted }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState(null);
  const [captureTimestamp, setCaptureTimestamp] = useState(0);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [useTldraw, setUseTldraw] = useState(true); // Use tldraw by default

  // Debug logging
  useEffect(() => {
    console.log('Editor state:', { showEditor, capturedFrame: !!capturedFrame });
  }, [showEditor, capturedFrame]);

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'a':
          e.preventDefault();
          handleAnnotate();
          break;
        case 'arrowleft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVideoClick = () => {
    togglePlayPause();
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const handleAnnotate = () => {
    const video = videoRef.current;
    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Check if video is loaded
    if (video.readyState < 2) {
      alert('Video is still loading. Please wait a moment and try again.');
      return;
    }

    // Pause video
    video.pause();
    setIsPlaying(false);

    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      if (canvas.width === 0 || canvas.height === 0) {
        alert('Unable to capture frame. Video dimensions are invalid.');
        return;
      }

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob and show editor
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to capture frame. Please try again.');
          return;
        }
        
        const url = URL.createObjectURL(blob);
        setCapturedFrame({ url, width: canvas.width, height: canvas.height });
        setCaptureTimestamp(Math.floor(video.currentTime * 1000));
        setShowEditor(true);
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing frame:', error);
      alert('Failed to capture frame: ' + error.message);
    }
  };

  const handleSaveAnnotation = (annotatedImageBlob) => {
    // This is handled by the AnnotationEditor component
    console.log('Annotation saved, closing editor');
    setShowEditor(false);
    setCapturedFrame(null);
    
    // Resume video playback from where it was paused
    const video = videoRef.current;
    if (video) {
      video.currentTime = captureTimestamp / 1000;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleCancelAnnotation = () => {
    console.log('Annotation cancelled');
    setShowEditor(false);
    setCapturedFrame(null);
    
    // Resume video playback from where it was paused
    const video = videoRef.current;
    if (video) {
      video.currentTime = captureTimestamp / 1000;
      video.play();
      setIsPlaying(true);
    }
  };

  const handleMarkerClick = (annotation) => {
    const video = videoRef.current;
    if (!video) return;

    // Pause and seek to annotation timestamp
    video.pause();
    setIsPlaying(false);
    video.currentTime = annotation.timestamp_ms / 1000;
    
    // Show annotation viewer
    setSelectedAnnotation(annotation);
  };

  const handleEditAnnotation = (annotation) => {
    // Close the viewer first
    setSelectedAnnotation(null);
    
    // Load the annotation image for editing
    fetch(annotation.image_path)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        // We need to get image dimensions
        const img = new Image();
        img.onload = () => {
          setCapturedFrame({ url, width: img.width, height: img.height });
          setCaptureTimestamp(annotation.timestamp_ms);
          setShowEditor(true);
        };
        img.src = url;
      })
      .catch(err => {
        console.error('Failed to load annotation for editing:', err);
        alert('Failed to load annotation for editing');
      });
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[600px] cursor-pointer"
          crossOrigin="anonymous"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={handleVideoClick}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-3">
        {/* Timeline with markers */}
        <Timeline
          currentTime={currentTime}
          duration={duration}
          annotations={annotations}
          onSeek={handleSeek}
          onMarkerClick={handleMarkerClick}
        />

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Toggle fullscreen"
            >
              ⛶ Fullscreen
            </button>
            
            <span className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="space-x-4">
            <button
              onClick={handleAnnotate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Annotate current frame"
            >
              📝 Annotate
            </button>
            
            <button
              onClick={() => setUseTldraw(!useTldraw)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              title="Toggle editor type"
            >
              Editor: {useTldraw ? '🎨 Advanced' : '✏️ Simple'}
            </button>
          </div>
          
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-gray-500">
              Editor: {showEditor ? 'Open' : 'Closed'} | Frame: {capturedFrame ? 'Yes' : 'No'}
            </span>
          )}
        </div>
      </div>

      {/* Annotation Editor Modal */}
      {showEditor && capturedFrame && (
        useTldraw ? (
          <AnnotationEditorTldraw
            videoId={videoId}
            frameImage={capturedFrame}
            timestamp={captureTimestamp}
            onSave={(annotation) => {
              onAnnotationCreated(annotation);
              setShowEditor(false);
              setCapturedFrame(null);
            }}
            onCancel={handleCancelAnnotation}
          />
        ) : (
          <AnnotationEditor
            videoId={videoId}
            frameImage={capturedFrame}
            timestamp={captureTimestamp}
            onSave={(annotation) => {
              onAnnotationCreated(annotation);
              setShowEditor(false);
              setCapturedFrame(null);
            }}
            onCancel={handleCancelAnnotation}
          />
        )
      )}

      {/* Annotation Viewer Modal */}
      {selectedAnnotation && (
        <AnnotationViewer
          annotation={selectedAnnotation}
          onClose={() => setSelectedAnnotation(null)}
          onEdit={() => handleEditAnnotation(selectedAnnotation)}
          onDelete={(id) => {
            onAnnotationDeleted(id);
            setSelectedAnnotation(null);
          }}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
