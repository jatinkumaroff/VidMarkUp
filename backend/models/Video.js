const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  videoUrl:     { type: String, required: true },
  thumbnailUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Video", VideoSchema);