const router = require("express").Router();
const PDFDocument = require("pdfkit");
const axios = require("axios");
const Marker = require("../models/Marker");
const Video = require("../models/Video");

// GET /api/export/:videoId
router.get("/:videoId", async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId);
    if (!video) return res.status(404).json({ error: "Video not found" });

    const markers = await Marker.find({
      videoId: req.params.videoId,
      "assets.mergedImageHr": { $ne: null },
    }).sort({ timestamp: 1 });

    if (!markers.length) {
      return res
        .status(404)
        .json({ error: "No annotated frames found for this video" });
    }

    const doc = new PDFDocument({ autoFirstPage: false, margin: 40 });
    const safeName = video.title.replace(/[^a-z0-9]/gi, "_");

    //for forced download by the browser
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}_annotations.pdf"`,
    );
    doc.pipe(res);

    for (const marker of markers) {
      // Fetch the image buffer from S3
      const imgResponse = await axios.get(marker.assets.mergedImageHr, {
        responseType: "arraybuffer",
      });
      const imgBuffer = Buffer.from(imgResponse.data);

      // Auto-size page to image dimensions
      const img = doc.openImage(imgBuffer);
      const pageW = img.width + 80;
      const pageH = img.height + 100;

      doc.addPage({ size: [pageW, pageH] });

      // Header: timestamp
      const mins = Math.floor(marker.timestamp / 60)
        .toString()
        .padStart(2, "0");
      const secs = Math.floor(marker.timestamp % 60)
        .toString()
        .padStart(2, "0");
      doc
        .fontSize(10)
        .fillColor("#555")
        .text(`${video.title}  —  ${mins}:${secs}`, 40, 20);

      // Image
      doc.image(imgBuffer, 40, 45, { width: img.width });
    }

    doc.end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
