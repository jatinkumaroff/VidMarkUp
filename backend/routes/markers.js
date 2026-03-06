const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Marker = require("../models/Marker");

// ─── GET /api/markers?videoId=xxx ────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { videoId } = req.query;
    if (!videoId)
      return res.status(400).json({ error: "videoId query param required" });
    const markers = await Marker.find({ videoId })
      .sort({ timestamp: 1 })
      .lean();
    res.json(markers);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/markers ───────────────────────────────────────────────────────
router.post("/", (req, res, next) => {
  const memUpload = multer({ storage: multer.memoryStorage() }).fields([
    { name: "rawImageHr", maxCount: 1 },
    { name: "mergedImageHr", maxCount: 1 },
    { name: "previewImageLr", maxCount: 1 },
  ]);

  memUpload(req, res, async (multerErr) => {
    if (multerErr) return next(multerErr);

    const { videoId, timestamp } = req.body;
    if (!videoId || timestamp == null)
      return res
        .status(400)
        .json({ error: "videoId and timestamp are required" });

    try {
      const files = req.files || {};
      const { r2Configured, s3 } = require("../middleware/upload");

      const assets = {
        rawImageHr: null,
        mergedImageHr: null,
        previewImageLr: null,
        annotations: req.body.annotations
          ? JSON.parse(req.body.annotations)
          : null,
      };

      if (r2Configured && s3) {
        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        const bucket = process.env.R2_BUCKET_NAME;
        const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

        const toR2 = async (file, suffix) => {
          const key = `markers/${videoId}-${timestamp}-${suffix}.jpg`;
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
          return `${publicUrl}/${key}`;
        };

        if (files.rawImageHr?.[0])
          assets.rawImageHr = await toR2(files.rawImageHr[0], "raw");
        if (files.mergedImageHr?.[0])
          assets.mergedImageHr = await toR2(files.mergedImageHr[0], "merged");
        if (files.previewImageLr?.[0])
          assets.previewImageLr = await toR2(
            files.previewImageLr[0],
            "preview",
          );
      } else {
        const uploadDir = path.join(__dirname, "..", "uploads", "markers");
        fs.mkdirSync(uploadDir, { recursive: true });
        const base =
          process.env.SERVER_URL ||
          `http://localhost:${process.env.PORT || 3000}`;

        const toDisk = (file, suffix) => {
          const filename = `${videoId}-${timestamp}-${suffix}.jpg`;
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
          return `${base}/uploads/markers/${filename}`;
        };

        if (files.rawImageHr?.[0])
          assets.rawImageHr = toDisk(files.rawImageHr[0], "raw");
        if (files.mergedImageHr?.[0])
          assets.mergedImageHr = toDisk(files.mergedImageHr[0], "merged");
        if (files.previewImageLr?.[0])
          assets.previewImageLr = toDisk(files.previewImageLr[0], "preview");
      }

      const marker = await Marker.create({
        videoId,
        timestamp: Number(timestamp),
        assets,
      });
      res.status(201).json(marker);
    } catch (err) {
      next(err);
    }
  });
});

// ─── PUT /api/markers/:markerId ──────────────────────────────────────────────
router.put("/:markerId", (req, res, next) => {
  const memUpload = multer({ storage: multer.memoryStorage() }).fields([
    { name: "mergedImageHr", maxCount: 1 },
    { name: "previewImageLr", maxCount: 1 },
  ]);

  memUpload(req, res, async (multerErr) => {
    if (multerErr) return next(multerErr);
    try {
      const existing = await Marker.findById(req.params.markerId).lean();
      if (!existing) return res.status(404).json({ error: "Marker not found" });

      const files = req.files || {};
      const ts = req.body.timestamp ?? existing.timestamp;
      const { r2Configured, s3 } = require("../middleware/upload");
      const updateFields = {};

      if (r2Configured && s3) {
        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        const bucket = process.env.R2_BUCKET_NAME;
        const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");

        const toR2 = async (file, suffix) => {
          const key = `markers/${existing.videoId}-${ts}-${suffix}.jpg`;
          await s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
          return `${publicUrl}/${key}`;
        };

        if (files.mergedImageHr?.[0])
          updateFields["assets.mergedImageHr"] = await toR2(
            files.mergedImageHr[0],
            "merged",
          );
        if (files.previewImageLr?.[0])
          updateFields["assets.previewImageLr"] = await toR2(
            files.previewImageLr[0],
            "preview",
          );
      } else {
        const uploadDir = path.join(__dirname, "..", "uploads", "markers");
        fs.mkdirSync(uploadDir, { recursive: true });
        const base =
          process.env.SERVER_URL ||
          `http://localhost:${process.env.PORT || 3000}`;

        const toDisk = (file, suffix) => {
          const filename = `${existing.videoId}-${ts}-${suffix}.jpg`;
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
          return `${base}/uploads/markers/${filename}`;
        };

        if (files.mergedImageHr?.[0])
          updateFields["assets.mergedImageHr"] = toDisk(
            files.mergedImageHr[0],
            "merged",
          );
        if (files.previewImageLr?.[0])
          updateFields["assets.previewImageLr"] = toDisk(
            files.previewImageLr[0],
            "preview",
          );
      }

      if (req.body.annotations)
        updateFields["assets.annotations"] = JSON.parse(req.body.annotations);

      const marker = await Marker.findByIdAndUpdate(
        req.params.markerId,
        { $set: updateFields },
        { new: true },
      );
      res.json(marker);
    } catch (err) {
      next(err);
    }
  });
});

// ─── DELETE /api/markers/:markerId ───────────────────────────────────────────
router.delete("/:markerId", async (req, res, next) => {
  console.log("\n=== DELETE marker:", req.params.markerId, "===");
  try {
    const marker = await Marker.findById(req.params.markerId).lean();
    if (!marker) {
      console.log("Marker not found in MongoDB");
      return res.status(404).json({ error: "Marker not found" });
    }

    const { r2Configured, s3 } = require("../middleware/upload");
    console.log("r2Configured:", r2Configured);

    const { rawImageHr, mergedImageHr, previewImageLr } = marker.assets || {};
    console.log("Stored URLs:", { rawImageHr, mergedImageHr, previewImageLr });

    if (r2Configured && s3) {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      const bucket = process.env.R2_BUCKET_NAME;
      const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
      console.log("R2 bucket:", bucket, "| publicUrl:", publicUrl);

      // Extract exact key from stored URL — strips domain prefix and ?v= cache param
      const urlToKey = (url) => {
        if (!url) return null;
        const withoutQuery = url.split("?")[0];
        return withoutQuery.replace(publicUrl + "/", "");
      };

      const keys = [rawImageHr, mergedImageHr, previewImageLr]
        .map(urlToKey)
        .filter(Boolean);

      console.log("Keys to delete from R2:", keys);

      // allSettled so one failure doesn't block the others or MongoDB deletion
      const results = await Promise.allSettled(
        keys.map((key) =>
          s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
        ),
      );

      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          console.log(`✅ Deleted R2 key: ${keys[i]}`);
        } else {
          console.error(
            `❌ Failed R2 key: ${keys[i]} —`,
            result.reason?.message,
          );
        }
      });
    } else {
      console.log("R2 not configured — deleting from local disk");
      const uploadDir = path.join(__dirname, "..", "uploads", "markers");
      [rawImageHr, mergedImageHr, previewImageLr]
        .filter(Boolean)
        .forEach((url) => {
          const filename = path.basename(url.split("?")[0]);
          const filepath = path.join(uploadDir, filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log("Deleted local file:", filename);
          } else {
            console.log("Local file not found (skipping):", filename);
          }
        });
    }

    await Marker.findByIdAndDelete(req.params.markerId);
    console.log("MongoDB document deleted ✅\n");

    res.json({ message: "Marker deleted" });
  } catch (err) {
    console.error("DELETE route error:", err);
    next(err);
  }
});

module.exports = router;
