import React from 'react';
import { annotationService } from '../services/api';

const AnnotationViewer = ({ annotation, onClose, onEdit, onDelete }) => {
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this annotation?')) {
      return;
    }

    try {
      await annotationService.deleteAnnotation(annotation.videoId, annotation.id);
      onDelete(annotation.id);
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      alert('Failed to delete annotation. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Saved Annotation</h2>
              <p className="text-sm text-gray-600 mt-1">
                {annotation.timecode} • {new Date(annotation.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close viewer"
            >
              ×
            </button>
          </div>

          {/* Image */}
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-900">
            <img
              src={annotation.image_path}
              alt="Annotation"
              className="w-full h-auto"
            />
          </div>

          {/* Notes */}
          {annotation.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-1">Notes:</div>
              <div className="text-gray-800">{annotation.notes}</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              🗑 Delete
            </button>
            <div className="space-x-4">
              <button
                onClick={onEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                ✏️ Edit
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationViewer;
