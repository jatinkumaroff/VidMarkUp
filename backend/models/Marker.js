const mongoose = require('mongoose');

const MarkerSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
    index: true,
  },
  timestamp: { type: Number, required: true },
  assets: {
    rawImageHr:     { type: String, default: null },
    mergedImageHr:  { type: String, default: null },
    previewImageLr: { type: String, default: null },
    annotations:    { type: mongoose.Schema.Types.Mixed, default: null },
  },
}, { timestamps: true });

module.exports = mongoose.model('Marker', MarkerSchema);