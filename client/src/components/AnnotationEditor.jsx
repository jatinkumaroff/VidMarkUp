import React, { useState, useRef, useEffect } from 'react';
import { annotationService } from '../services/api';

const AnnotationEditor = ({ videoId, frameImage, timestamp, onSave, onCancel }) => {
  console.log('AnnotationEditor mounted', { videoId, frameImage, timestamp });
  
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // 'pen' or 'text'
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [textBoxes, setTextBoxes] = useState([]);
  const [editingTextIndex, setEditingTextIndex] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize canvas with captured frame
  useEffect(() => {
    console.log('AnnotationEditor useEffect triggered');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onerror = (error) => {
      console.error('Failed to load captured image:', error);
      alert('Failed to load captured frame. Please try again.');
    };
    
    img.onload = () => {
      console.log('Image loaded successfully', { width: frameImage.width, height: frameImage.height });
      canvas.width = frameImage.width;
      canvas.height = frameImage.height;
      ctx.drawImage(img, 0, 0);
      setImageLoaded(true);
      // Save initial state to history
      saveToHistory();
    };
    
    img.src = frameImage.url;

    // Trap focus in modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frameImage]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setHistory(prev => [...prev, dataUrl]);
  };

  const handleMouseDown = (e) => {
    if (tool === 'text') {
      handleTextClick(e);
      return;
    }

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || tool !== 'pen') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleTextClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factor
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get actual canvas coordinates
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newTextBox = {
      x,
      y,
      displayX: e.clientX - rect.left,
      displayY: e.clientY - rect.top,
      text: '',
      id: Date.now()
    };
    setTextBoxes(prev => [...prev, newTextBox]);
    setEditingTextIndex(textBoxes.length);
  };

  const handleTextChange = (index, newText) => {
    setTextBoxes(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], text: newText };
      return updated;
    });
  };

  const handleTextBlur = (index) => {
    const textBox = textBoxes[index];
    if (textBox.text.trim()) {
      // Draw text on canvas
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 24px Arial';
      ctx.fillStyle = '#FF0000';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      
      // Add white outline for better visibility
      ctx.strokeText(textBox.text, textBox.x, textBox.y);
      ctx.fillText(textBox.text, textBox.x, textBox.y);
      saveToHistory();
    }
    setEditingTextIndex(null);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;

    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = newHistory[newHistory.length - 1];
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Reload original image
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory([canvas.toDataURL()]);
      setTextBoxes([]);
    };
    img.src = frameImage.url;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const canvas = canvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
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
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Annotate Frame</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close editor"
            >
              ×
            </button>
          </div>

          {/* Toolbar */}
          <div className="mb-4 p-4 bg-gray-100 rounded-lg space-y-3">
            <div className="flex items-center space-x-4">
              <div className="font-semibold">Tool:</div>
              <button
                onClick={() => setTool('pen')}
                className={`px-4 py-2 rounded ${
                  tool === 'pen' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                🖊 Pen
              </button>
              <button
                onClick={() => setTool('text')}
                className={`px-4 py-2 rounded ${
                  tool === 'text' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                📝 Text
              </button>
            </div>

            {tool === 'pen' && (
              <div className="flex items-center space-x-4">
                <div className="font-semibold">Stroke:</div>
                <button
                  onClick={() => setStrokeWidth(2)}
                  className={`px-4 py-2 rounded ${
                    strokeWidth === 2 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Thin
                </button>
                <button
                  onClick={() => setStrokeWidth(5)}
                  className={`px-4 py-2 rounded ${
                    strokeWidth === 5 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Thick
                </button>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="px-4 py-2 bg-white text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ↶ Undo
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-white text-gray-700 rounded hover:bg-gray-50"
              >
                🗑 Clear
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-900">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                <div>Loading captured frame...</div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            {/* Text input boxes */}
            {textBoxes.map((textBox, index) => (
              editingTextIndex === index && (
                <input
                  key={textBox.id}
                  type="text"
                  value={textBox.text}
                  onChange={(e) => handleTextChange(index, e.target.value)}
                  onBlur={() => handleTextBlur(index)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTextBlur(index);
                    }
                  }}
                  autoFocus
                  className="absolute bg-white border-2 border-blue-500 px-2 py-1 text-lg z-10"
                  style={{
                    left: `${textBox.displayX || textBox.x}px`,
                    top: `${(textBox.displayY || textBox.y) - 30}px`,
                  }}
                />
              )
            ))}
          </div>

          {/* Notes */}
          <div className="mt-4">
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
          <div className="mt-6 flex items-center justify-end space-x-4">
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

export default AnnotationEditor;
