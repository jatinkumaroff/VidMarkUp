import React, { useState, useRef, useEffect } from 'react';
import { Tldraw, exportToBlob, createTLStore } from 'tldraw';
import 'tldraw/tldraw.css';
import { annotationService } from '../services/api';

const AnnotationEditorTldraw = ({ videoId, frameImage, timestamp, onSave, onCancel }) => {
  console.log('AnnotationEditor (tldraw) mounted', { videoId, frameImage, timestamp });
  
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [store] = useState(() => createTLStore());
  const editorRef = useRef(null);

  useEffect(() => {
    // Trap focus in modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Set background image in tldraw
  useEffect(() => {
    if (!editorRef.current || !frameImage) return;
    
    const editor = editorRef.current;
    
    // Wait for editor to be ready
    setTimeout(() => {
      try {
        // Create an image shape with the captured frame
        const imageAssetId = editor.createAssetId();
        
        // Add the image as an asset
        editor.createAssets([{
          id: imageAssetId,
          type: 'image',
          props: {
            src: frameImage.url,
            w: frameImage.width,
            h: frameImage.height,
            mimeType: 'image/png',
            isAnimated: false,
          }
        }]);

        // Create image shape
        editor.createShape({
          type: 'image',
          x: 0,
          y: 0,
          props: {
            assetId: imageAssetId,
            w: frameImage.width,
            h: frameImage.height,
          },
          isLocked: true, // Lock the background image
        });

        // Zoom to fit
        editor.zoomToFit();
      } catch (error) {
        console.error('Error setting up tldraw:', error);
      }
    }, 100);
  }, [frameImage]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const editor = editorRef.current;
      if (!editor) {
        throw new Error('Editor not available');
      }

      // Export the current canvas to a blob
      const blob = await exportToBlob({
        editor,
        format: 'png',
        opts: { background: true }
      });

      // Upload annotation
      const annotation = await annotationService.createAnnotation(
        videoId,
        timestamp,
        blob,
        notes
      );

      onSave(annotation);
    } catch (error) {
      console.error('Failed to save annotation:', error);
      alert('Failed to save annotation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold">Annotate Frame</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close editor"
          >
            ×
          </button>
        </div>

        {/* Tldraw Canvas */}
        <div className="flex-1 relative">
          <Tldraw
            store={store}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>

        {/* Bottom controls */}
        <div className="p-4 border-t space-y-3">
          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Notes (optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add notes about this annotation..."
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : '💾 Save Annotation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationEditorTldraw;
