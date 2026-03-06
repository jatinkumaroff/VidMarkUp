// routes/_env-check.js
const express = require("express");
const router = express.Router();

// SAFE runtime check for presence of important env vars (does NOT print secrets)
router.get("/", (req, res) => {
  res.json({
    ok: true,
    env: {
      R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
      R2_PUBLIC_URL:  !!process.env.R2_PUBLIC_URL,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      NODE_ENV: process.env.NODE_ENV || null,
      SERVER_URL: process.env.SERVER_URL || null
    }
  });
});

module.exports = router;