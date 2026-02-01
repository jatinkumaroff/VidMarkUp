import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const annotationService = {
  // Create new annotation
  createAnnotation: async (videoId, timestamp_ms, imageBlob, notes = '') => {
    const formData = new FormData();
    formData.append('timestamp_ms', timestamp_ms);
    formData.append('notes', notes);
    formData.append('image', imageBlob, 'annotation.png');

    const response = await api.post(`/videos/${videoId}/annotations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all annotations for a video
  getAnnotations: async (videoId) => {
    const response = await api.get(`/videos/${videoId}/annotations`);
    return response.data;
  },

  // Get single annotation
  getAnnotation: async (videoId, annotationId) => {
    const response = await api.get(`/videos/${videoId}/annotations/${annotationId}`);
    return response.data;
  },

  // Delete annotation
  deleteAnnotation: async (videoId, annotationId) => {
    const response = await api.delete(`/videos/${videoId}/annotations/${annotationId}`);
    return response.data;
  },
};

export default api;
