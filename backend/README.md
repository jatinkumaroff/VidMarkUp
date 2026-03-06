# Video Annotation Backend

## Stack
- **Express.js** — REST API
- **MongoDB / Mongoose** — Database
- **Multer + multer-s3** — Image uploads directly to S3
- **PDFKit + axios** — PDF export

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## API Reference

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | List all videos (for dropdown) |
| POST | `/api/videos` | Add a video `{ title, videoUrl }` |
| GET | `/api/videos/:videoId` | Load video + its markers |
| DELETE | `/api/videos/:videoId` | Delete video and all its markers |

### Markers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/markers` | Create marker (FormData) |
| PUT | `/api/markers/:markerId` | Update marker edits (FormData) |
| DELETE | `/api/markers/:markerId` | Delete a single marker |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/:videoId` | Stream PDF of all annotated frames |

## POST /api/markers — FormData fields
| Field | Type | Required |
|-------|------|----------|
| `videoId` | string | ✅ |
| `timestamp` | number | ✅ |
| `annotations` | JSON string | optional |
| `rawImageHr` | file | optional |
| `mergedImageHr` | file | optional |
| `previewImageLr` | file | optional |

## File Naming in S3
```
markers/{videoId}-{timestamp}-raw.jpg
markers/{videoId}-{timestamp}-merged.jpg
markers/{videoId}-{timestamp}-preview.jpg
```
