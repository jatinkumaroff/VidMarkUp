import React, { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import { annotationService } from './services/api';

function App() {
  // Sample video (from seed data)
  const [videoData, setVideoData] = useState({
    id: 'sample-video-1',
    title: 'Sample Video - Big Buck Bunny',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  });

  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Load annotations on mount
  useEffect(() => {
    loadAnnotations();
  }, [videoData.id]);

  const loadAnnotations = async () => {
    try {
      setLoading(true);
      const data = await annotationService.getAnnotations(videoData.id);
      setAnnotations(data);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnotationCreated = (newAnnotation) => {
    setAnnotations(prev => [...prev, newAnnotation].sort((a, b) => a.timestamp_ms - b.timestamp_ms));
  };

  const handleAnnotationDeleted = (annotationId) => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
  };

  const handleChangeVideo = () => {
    if (!customUrl.trim()) {
      alert('Please enter a valid video URL');
      return;
    }

    // Create new video data with custom URL
    const newVideoId = 'custom-video-' + Date.now();
    setVideoData({
      id: newVideoId,
      title: 'Custom Video',
      url: customUrl.trim()
    });
    setAnnotations([]); // Clear annotations for new video
    setShowUrlInput(false);
    setCustomUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Video Annotator</h1>
          <p className="text-sm text-gray-600 mt-1">
            Capture frames, annotate, and save with timeline markers
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{videoData.title}</h2>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🔗 Change Video
            </button>
          </div>

          {/* Custom Video URL Input */}
          {showUrlInput && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold mb-2">
                Enter Video URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleChangeVideo()}
                />
                <button
                  onClick={handleChangeVideo}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Load Video
                </button>
                <button
                  onClick={() => {
                    setShowUrlInput(false);
                    setCustomUrl('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter a direct link to an MP4 video file. Make sure the video allows CORS.
              </p>
            </div>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-gray-500">Loading video...</div>
            </div>
          ) : (
            <VideoPlayer
              videoId={videoData.id}
              videoUrl={videoData.url}
              annotations={annotations}
              onAnnotationCreated={handleAnnotationCreated}
              onAnnotationDeleted={handleAnnotationDeleted}
            />
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Controls:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <kbd className="px-2 py-1 bg-white border rounded">Space</kbd> - Play/Pause</li>
              <li>• <kbd className="px-2 py-1 bg-white border rounded">A</kbd> - Annotate current frame</li>
              <li>• <kbd className="px-2 py-1 bg-white border rounded">←</kbd> / <kbd className="px-2 py-1 bg-white border rounded">→</kbd> - Seek ±5 seconds</li>
              <li>• Click timeline markers to view saved annotations</li>
              <li>• Hover markers for thumbnail preview</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
