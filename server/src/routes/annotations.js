import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import db from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to format timestamp as HH:MM:SS.mmm
function formatTimecode(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const ms = milliseconds % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Helper function to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// POST /api/videos/:videoId/annotations - Create new annotation
router.post('/:videoId/annotations', upload.single('image'), async (req, res) => {
  try {
    const { videoId } = req.params;
    const { timestamp_ms, notes = '' } = req.body;
    
    // Validate input
    if (!timestamp_ms || !req.file) {
      return res.status(400).json({ error: 'Missing required fields: timestamp_ms and image file' });
    }

    // Generate unique annotation ID
    const annotationId = uuidv4();
    
    // Create storage directories
    const storagePath = path.join(__dirname, '..', '..', 'storage', 'videos', videoId, 'annotations', annotationId);
    await ensureDir(storagePath);
    
    // Save full image
    const imagePath = path.join(storagePath, 'image.png');
    await fs.writeFile(imagePath, req.file.buffer);
    
    // Generate and save thumbnail (max 200x200)
    const thumbPath = path.join(storagePath, 'thumb.png');
    await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'inside' })
      .png()
      .toFile(thumbPath);
    
    // Create annotation metadata
    const annotation = {
      id: annotationId,
      videoId,
      timestamp_ms: parseInt(timestamp_ms, 10),
      timecode: formatTimecode(parseInt(timestamp_ms, 10)),
      image_path: `/storage/videos/${videoId}/annotations/${annotationId}/image.png`,
      thumb_path: `/storage/videos/${videoId}/annotations/${annotationId}/thumb.png`,
      notes,
      created_at: new Date().toISOString()
    };
    
    // Save to database
    await db.read();
    db.data.annotations.push(annotation);
    await db.write();
    
    res.status(201).json(annotation);
  } catch (error) {
    console.error('Error creating annotation:', error);
    res.status(500).json({ error: 'Failed to create annotation' });
  }
});

// GET /api/videos/:videoId/annotations - List all annotations for a video
router.get('/:videoId/annotations', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    await db.read();
    const annotations = db.data.annotations
      .filter(a => a.videoId === videoId)
      .sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    
    res.json(annotations);
  } catch (error) {
    console.error('Error fetching annotations:', error);
    res.status(500).json({ error: 'Failed to fetch annotations' });
  }
});

// GET /api/videos/:videoId/annotations/:annotationId - Get single annotation
router.get('/:videoId/annotations/:annotationId', async (req, res) => {
  try {
    const { videoId, annotationId } = req.params;
    
    await db.read();
    const annotation = db.data.annotations.find(
      a => a.id === annotationId && a.videoId === videoId
    );
    
    if (!annotation) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    res.json(annotation);
  } catch (error) {
    console.error('Error fetching annotation:', error);
    res.status(500).json({ error: 'Failed to fetch annotation' });
  }
});

// DELETE /api/videos/:videoId/annotations/:annotationId - Delete annotation
router.delete('/:videoId/annotations/:annotationId', async (req, res) => {
  try {
    const { videoId, annotationId } = req.params;
    
    await db.read();
    const annotationIndex = db.data.annotations.findIndex(
      a => a.id === annotationId && a.videoId === videoId
    );
    
    if (annotationIndex === -1) {
      return res.status(404).json({ error: 'Annotation not found' });
    }
    
    // Remove from database
    db.data.annotations.splice(annotationIndex, 1);
    await db.write();
    
    // Delete files
    const storagePath = path.join(__dirname, '..', '..', 'storage', 'videos', videoId, 'annotations', annotationId);
    try {
      await fs.rm(storagePath, { recursive: true, force: true });
    } catch (error) {
      console.warn('Could not delete files:', error);
    }
    
    res.json({ message: 'Annotation deleted successfully', deleted: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

export default router;
