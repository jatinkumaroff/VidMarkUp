import React, { useState } from "react";

const ViewModal = ({ marker, onClose, onEdit, onDeleteSuccess }) => {
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState(null);

  if (!marker) return null;

  const mergedSrc = marker.assets?.mergedImageHr
    ? marker.assets.mergedImageHr + "?v=" + marker.updatedAt
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("https://vid-mark-up-backend.vercel.app/api/markers/" + marker._id, { method: "DELETE" });
      if (!res.ok) throw new Error("Server responded " + res.status);
      onDeleteSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-gray-900 border-2 border-yellow-400 rounded-lg shadow-2xl flex flex-col overflow-hidden">

        <div className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 shrink-0">
          <h2 className="text-white text-lg font-bold">View Annotation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold leading-none">×</button>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 bg-black overflow-hidden min-h-0">
          {mergedSrc ? (
            <img src={mergedSrc} alt="annotation" className="max-w-full max-h-full object-contain rounded" />
          ) : (
            <span className="text-gray-400 text-sm">No image saved</span>
          )}
        </div>

        {error && <div className="px-4 py-2 bg-red-900 text-red-200 text-xs shrink-0">{error}</div>}

        <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center shrink-0">
          <div>
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-semibold">Really delete this annotation?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-400 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 border-2 border-gray-400 rounded text-white hover:bg-gray-700 font-semibold transition-all">Close</button>
            <button onClick={onEdit} className="px-6 py-2 bg-yellow-400 text-black font-bold rounded hover:bg-yellow-300 transition-all">Edit in Tldraw</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewModal;