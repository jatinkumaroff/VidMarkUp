const router = require("express").Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Video = require("../models/Video");
const Marker = require("../models/Marker");
const mongoose = require("mongoose");
//GET /api/videos
router.get("/", async (req, res, next) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();
    res.json(videos);
  } catch (err) {
    next(err);
  }
});

//GET /api/videos/summary
// Returns all videos with markerCount attached, used by the Notes page.
router.get("/summary", async (req, res, next) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 }).lean();
    const markers = await Marker.find({}).lean();
    //getting all videos and markers

    const result = videos.map((video) => {
      let count = 0;
      for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        if (String(marker.videoId) === String(video._id)) {
          count++;
        }
      }
      return {
        _id: video._id,
        title: video.title,
        videoUrl: video.videoUrl,
        thumbnailUrl: video.thumbnailUrl,
        createdAt: video.createdAt,
        markerCount: count,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

//POST /api/videos/presign
router.post("/presign", async (req, res, next) => {
  try {
    const { r2Configured, s3 } = require("../middleware/upload");
    if (!r2Configured || !s3) {
      return res.status(400).json({
        error: "R2 is not configured.",
      });
    }

    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    const { PutObjectCommand } = require("@aws-sdk/client-s3");

    const { title, filename, contentType, thumbFilename, thumbContentType } =
      req.body;
    if (!title || !filename || !contentType)
      return res
        .status(400)
        .json({ error: "title, filename and contentType are required" });

    const bucket = process.env.R2_BUCKET_NAME;
    const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
    const safeName = title.replace(/[^a-z0-9]/gi, "_");

    const videoExt = path.extname(filename) || ".mp4";
    const videoKey = `videos/${Date.now()}-${safeName}${videoExt}`;
    const videoUploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: videoKey,
        ContentType: contentType,
      }),
      { expiresIn: 3600 },
    );

    let thumbUploadUrl = null;
    let thumbnailUrl = null;
    if (thumbFilename && thumbContentType) {
      const thumbExt = path.extname(thumbFilename) || ".jpg";
      const thumbKey = `thumbnails/${Date.now()}-${safeName}${thumbExt}`;
      thumbUploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: bucket,
          Key: thumbKey,
          ContentType: thumbContentType,
        }),
        { expiresIn: 3600 },
      );
      thumbnailUrl = `${publicUrl}/${thumbKey}`;
    }

    res.json({
      videoUploadUrl,
      videoUrl: `${publicUrl}/${videoKey}`,
      thumbUploadUrl,
      thumbnailUrl,
    });
  } catch (err) {
    next(err);
  }
});

//POST /api/videos
//multer upload , jo frontend se backend se cloud tha, was removed due to vercel.
//worked fine on local as used RAM to save in meanwhile, but vercel ne aukat dikhadi
router.post("/", async (req, res, next) => {
  try {
    const { title, videoUrl, thumbnailUrl } = req.body;

    const video = await Video.create({
      title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
    });

    return res.status(201).json(video);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/videos/:videoId ─────────────────────────────────────────────────
router.get("/:videoId", async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId).lean();
    if (!video) return res.status(404).json({ error: "Video not found" });
    res.json(video);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/videos/:videoId ─────────────────────────────────────────────
router.delete("/:videoId", async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.videoId).lean();
    if (!video) return res.status(404).json({ error: "Video not found" });

    const { r2Configured, s3 } = require("../middleware/upload");
    const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
    const urlToKey = (url) => url?.split("?")[0].replace(publicUrl + "/", "");

    if (r2Configured && s3) {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      const toDelete = [video.videoUrl, video.thumbnailUrl]
        .filter(Boolean)
        .filter((u) => u.startsWith(publicUrl))
        .map(urlToKey);
      await Promise.allSettled(
        toDelete.map((k) =>
          s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME,
              Key: k,
            }),
          ),
        ),
      );
      const markers = await Marker.find({ videoId: req.params.videoId }).lean();
      for (const m of markers) {
        const keys = [
          m.assets?.rawImageHr,
          m.assets?.mergedImageHr,
          m.assets?.previewImageLr,
        ]
          .filter(Boolean)
          .map(urlToKey);
        await Promise.allSettled(
          keys.map((k) =>
            s3.send(
              new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: k,
              }),
            ),
          ),
        );
      }
    }

    await Marker.deleteMany({ videoId: req.params.videoId });
    await Video.findByIdAndDelete(req.params.videoId);
    res.json({ message: "Video and all markers deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
