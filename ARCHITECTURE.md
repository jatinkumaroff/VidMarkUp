# Video Annotator - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  React Frontend (Vite)                  │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ VideoPlayer  │  │ Timeline     │  │ Annotation   │ │ │
│  │  │ Component    │  │ Component    │  │ Editor       │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │           │                │                 │          │ │
│  │           └────────────────┴─────────────────┘          │ │
│  │                          │                               │ │
│  │                   ┌──────▼──────┐                       │ │
│  │                   │   API        │                       │ │
│  │                   │   Service    │                       │ │
│  │                   │   (Axios)    │                       │ │
│  │                   └──────────────┘                       │ │
│  └───────────────────────│──────────────────────────────── │ │
│                          │ HTTP/REST                         │
└──────────────────────────┼───────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │   Express Server    │
                │   (Node.js)         │
                │                     │
                │  ┌───────────────┐  │
                │  │   Routes      │  │
                │  │   /api/videos │  │
                │  └───────────────┘  │
                │         │           │
                │  ┌──────▼────────┐  │
                │  │   Multer      │  │
                │  │   (Uploads)   │  │
                │  └──────┬────────┘  │
                │         │           │
                │  ┌──────▼────────┐  │
                │  │   Sharp       │  │
                │  │   (Thumbnails)│  │
                │  └──────┬────────┘  │
                │         │           │
                │  ┌──────▼────────┐  │
                │  │   Lowdb       │  │
                │  │   (Metadata)  │  │
                │  └───────────────┘  │
                └─────────┬───────────┘
                          │
              ┌───────────▼────────────┐
              │   Filesystem Storage   │
              │                        │
              │   /storage/videos/     │
              │   └── {videoId}/       │
              │       └── annotations/ │
              │           └── {id}/    │
              │               ├─image  │
              │               └─thumb  │
              └────────────────────────┘
```

## Data Flow - Annotation Creation

```
1. User Action
   └─> Click "Annotate" button or press 'A'

2. Frontend (VideoPlayer)
   └─> Pause video
   └─> Capture frame to Canvas
   └─> Convert to Blob
   └─> Open AnnotationEditor modal

3. User Annotation
   └─> Draw with pen tool
   └─> Add text labels
   └─> Undo/Clear as needed

4. Save Action
   └─> Convert canvas to PNG Blob
   └─> Create FormData with:
       • timestamp_ms
       • notes (optional)
       • image file

5. API Call (Axios)
   └─> POST /api/videos/:videoId/annotations
   └─> Content-Type: multipart/form-data

6. Backend Processing
   └─> Multer receives file
   └─> Generate UUID for annotation
   └─> Create directory structure
   └─> Save full image
   └─> Generate 200x200 thumbnail (Sharp)
   └─> Create metadata object
   └─> Save to lowdb

7. Response
   └─> Return annotation object with paths

8. Frontend Update
   └─> Add annotation to state
   └─> Render new timeline marker
   └─> Close modal
```

## Component Hierarchy

```
App
├── VideoPlayer
│   ├── <video> element
│   ├── Timeline
│   │   └── Marker (for each annotation)
│   │       └── Tooltip (on hover)
│   ├── AnnotationEditor (modal)
│   │   ├── <canvas> (drawing surface)
│   │   ├── Toolbar (tools selection)
│   │   └── Text inputs (floating)
│   └── AnnotationViewer (modal)
│       ├── Image display
│       └── Action buttons
└── Instructions panel
```

## API Endpoints Detail

### POST /api/videos/:videoId/annotations
**Purpose**: Create new annotation
**Request**:
- Content-Type: multipart/form-data
- Fields:
  - timestamp_ms: number
  - notes: string (optional)
  - image: file (PNG)
**Response**: Annotation object
**Side Effects**:
- Creates files on filesystem
- Generates thumbnail
- Saves metadata to lowdb

### GET /api/videos/:videoId/annotations
**Purpose**: List all annotations for video
**Response**: Array of annotation objects (sorted by timestamp)

### GET /api/videos/:videoId/annotations/:annotationId
**Purpose**: Get single annotation
**Response**: Annotation object

### DELETE /api/videos/:videoId/annotations/:annotationId
**Purpose**: Delete annotation
**Side Effects**:
- Removes files from filesystem
- Removes metadata from lowdb

## State Management

### VideoPlayer State
```javascript
{
  isPlaying: boolean,
  currentTime: number (seconds),
  duration: number (seconds),
  showEditor: boolean,
  capturedFrame: { url, width, height } | null,
  captureTimestamp: number (milliseconds),
  selectedAnnotation: Annotation | null
}
```

### App State
```javascript
{
  annotations: Annotation[],
  loading: boolean
}
```

### AnnotationEditor State
```javascript
{
  tool: 'pen' | 'text',
  strokeWidth: 2 | 5,
  isDrawing: boolean,
  history: string[] (canvas data URLs),
  notes: string,
  isSaving: boolean,
  textBoxes: { x, y, text, id }[],
  editingTextIndex: number | null
}
```

## File Structure

```
video-annotator/
├── client/                      # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── VideoPlayer.jsx      # Main video player
│   │   │   ├── Timeline.jsx         # Progress bar with markers
│   │   │   ├── AnnotationEditor.jsx # Drawing/annotation modal
│   │   │   └── AnnotationViewer.jsx # View saved annotations
│   │   ├── services/
│   │   │   └── api.js              # Axios API client
│   │   ├── __tests__/              # Component tests
│   │   ├── App.jsx                 # Root component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── public/                     # Static assets
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vitest.config.js
│
├── server/                      # Backend application
│   ├── src/
│   │   ├── routes/
│   │   │   └── annotations.js      # API routes
│   │   ├── db.js                   # Lowdb setup
│   │   └── server.js               # Express app
│   ├── storage/                    # File storage (gitignored)
│   │   └── videos/
│   │       └── {videoId}/
│   │           └── annotations/
│   │               └── {annotationId}/
│   │                   ├── image.png
│   │                   └── thumb.png
│   ├── __tests__/                  # API tests
│   ├── seed.js                     # Database seeding
│   ├── db.json                     # Lowdb database (gitignored)
│   ├── package.json
│   └── .env
│
├── README.md
├── QUICKSTART.md
├── CHECKLIST.md
└── ARCHITECTURE.md (this file)
```

## Technology Choices Explained

### Why Lowdb?
- No installation required (just JSON file)
- Easy for reviewers to inspect data
- Perfect for development/demo
- Simple API similar to MongoDB
- Easy to swap for production DB

### Why Sharp?
- Fast image processing
- Native modules for performance
- Simple API for thumbnails
- Industry standard

### Why Multer?
- Standard for Express file uploads
- Simple middleware integration
- Memory storage for processing before saving

### Why Canvas API?
- Native browser support
- No heavy libraries needed
- Easy to explain in interviews
- Sufficient for basic annotations
- Direct pixel manipulation

### Why Vite?
- Fast development server
- Modern build tool
- Simple configuration
- Great DX with HMR

### Why Tailwind?
- Rapid UI development
- Consistent design
- No CSS file management
- Utility-first approach
- Easy to customize

## Performance Considerations

1. **Thumbnail Generation**: Reduces bandwidth for timeline previews
2. **Memory Storage**: Multer uses memory before saving (fast)
3. **Canvas Optimization**: Uses offscreen canvas for captures
4. **State Updates**: Minimal re-renders with proper state management
5. **File Serving**: Express static middleware (efficient)

## Security Considerations

**Current Implementation** (development/demo):
- No authentication required
- File validation by extension
- 10MB file size limit
- CORS configured for localhost

**Production Recommendations**:
- Add user authentication (JWT)
- Implement rate limiting
- Validate file content (not just extension)
- Use cloud storage (S3, etc.)
- Add CSRF protection
- Sanitize user inputs
- Use HTTPS

## Scalability Path

**Current**: Single server, local filesystem, JSON DB

**Step 1** - MongoDB + Local Storage:
- Replace lowdb with MongoDB
- Keep local filesystem
- Add indexing on videoId and timestamp

**Step 2** - Cloud Storage:
- Move images to S3/CloudStorage
- Update paths to use URLs
- Add CDN for serving

**Step 3** - Microservices:
- Separate annotation service
- Queue system for thumbnail generation
- Load balancing

**Step 4** - Real-time Features:
- WebSocket for live collaboration
- Redis for caching
- Message queue for processing
