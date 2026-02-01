import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../src/server.js';
import db from '../src/db.js';

describe('Annotation API Tests', () => {
  const testVideoId = 'test-video-1';

  beforeAll(async () => {
    // Initialize test data
    await db.read();
    db.data = { videos: [], annotations: [] };
    await db.write();
  });

  afterAll(async () => {
    // Clean up test data
    await db.read();
    db.data.annotations = db.data.annotations.filter(a => a.videoId !== testVideoId);
    await db.write();
  });

  it('GET /api/health should return status ok', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('GET /api/videos/:videoId/annotations should return empty array initially', async () => {
    const response = await request(app).get(`/api/videos/${testVideoId}/annotations`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('POST /api/videos/:videoId/annotations should create annotation', async () => {
    // Create a simple test image buffer
    const testImageBuffer = Buffer.from('fake-image-data');
    
    const response = await request(app)
      .post(`/api/videos/${testVideoId}/annotations`)
      .field('timestamp_ms', '5000')
      .field('notes', 'Test annotation')
      .attach('image', testImageBuffer, 'test.png');

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.videoId).toBe(testVideoId);
    expect(response.body.timestamp_ms).toBe(5000);
    expect(response.body.notes).toBe('Test annotation');
  });

  it('POST /api/videos/:videoId/annotations should fail without image', async () => {
    const response = await request(app)
      .post(`/api/videos/${testVideoId}/annotations`)
      .field('timestamp_ms', '5000');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  it('GET /api/videos/:videoId/annotations/:annotationId should return annotation', async () => {
    // First create an annotation
    const testImageBuffer = Buffer.from('fake-image-data');
    const createResponse = await request(app)
      .post(`/api/videos/${testVideoId}/annotations`)
      .field('timestamp_ms', '10000')
      .attach('image', testImageBuffer, 'test.png');

    const annotationId = createResponse.body.id;

    // Then fetch it
    const response = await request(app)
      .get(`/api/videos/${testVideoId}/annotations/${annotationId}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(annotationId);
  });

  it('DELETE /api/videos/:videoId/annotations/:annotationId should delete annotation', async () => {
    // First create an annotation
    const testImageBuffer = Buffer.from('fake-image-data');
    const createResponse = await request(app)
      .post(`/api/videos/${testVideoId}/annotations`)
      .field('timestamp_ms', '15000')
      .attach('image', testImageBuffer, 'test.png');

    const annotationId = createResponse.body.id;

    // Then delete it
    const deleteResponse = await request(app)
      .delete(`/api/videos/${testVideoId}/annotations/${annotationId}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.deleted).toBe(true);

    // Verify it's gone
    const getResponse = await request(app)
      .get(`/api/videos/${testVideoId}/annotations/${annotationId}`);

    expect(getResponse.status).toBe(404);
  });
});
