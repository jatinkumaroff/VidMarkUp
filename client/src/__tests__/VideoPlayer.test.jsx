import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoPlayer from '../components/VideoPlayer';

// Mock the annotation service
vi.mock('../services/api', () => ({
  annotationService: {
    getAnnotations: vi.fn(() => Promise.resolve([])),
    createAnnotation: vi.fn(),
    deleteAnnotation: vi.fn(),
  },
}));

describe('VideoPlayer Component', () => {
  const mockProps = {
    videoId: 'test-video-1',
    videoUrl: 'https://example.com/video.mp4',
    annotations: [],
    onAnnotationCreated: vi.fn(),
    onAnnotationDeleted: vi.fn(),
  };

  it('renders video player with controls', () => {
    render(<VideoPlayer {...mockProps} />);
    
    // Check for video element
    const video = screen.getByRole('slider', { name: /video progress/i });
    expect(video).toBeInTheDocument();
    
    // Check for control buttons
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annotate/i })).toBeInTheDocument();
  });

  it('renders with annotations', () => {
    const annotations = [
      {
        id: '1',
        videoId: 'test-video-1',
        timestamp_ms: 5000,
        timecode: '00:00:05.000',
        image_path: '/test.png',
        thumb_path: '/test_thumb.png',
        notes: 'Test annotation',
        created_at: new Date().toISOString(),
      },
    ];

    render(<VideoPlayer {...mockProps} annotations={annotations} />);
    
    // Should render without errors
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });
});
