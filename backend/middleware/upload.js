const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');

// ── Check if R2 is fully configured ──────────────────────────────────────────
const r2Configured =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME &&
  process.env.R2_ACCOUNT_ID !== 'your_cloudflare_account_id';

let s3 = null;

if (r2Configured) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  console.log('✅ R2 storage configured');
} else {
  console.log('⚠️  R2 not configured — using local disk storage (uploads/)');
}

// ── Upload factory ────────────────────────────────────────────────────────────
const upload = (videoId, timestamp) => {
  if (r2Configured) {
    // ── R2 / S3 storage ──
    const multerS3 = require('multer-s3');
    return multer({
      storage: multerS3({
        s3,
        bucket: process.env.R2_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
          const suffix = file.fieldname === 'rawImageHr'    ? 'raw'
                       : file.fieldname === 'mergedImageHr' ? 'merged'
                       :                                       'preview';
          cb(null, `markers/${videoId}-${timestamp}-${suffix}.jpg`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    });
  } else {
    // ── Local disk storage fallback ──
    const uploadDir = path.join(__dirname, '..', 'uploads', 'markers');
    fs.mkdirSync(uploadDir, { recursive: true });

    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
          const suffix = file.fieldname === 'rawImageHr'    ? 'raw'
                       : file.fieldname === 'mergedImageHr' ? 'merged'
                       :                                       'preview';
          cb(null, `${videoId}-${timestamp}-${suffix}.jpg`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    });
  }
};

// Helper: get public URL for a saved file
const getFileUrl = (req, file) => {
  if (r2Configured) {
    return file.location; // multer-s3 sets this
  }
  // Local: build a URL using the server's base URL
  const base = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${base}/uploads/markers/${file.filename}`;
};

module.exports = { upload, s3, getFileUrl, r2Configured };