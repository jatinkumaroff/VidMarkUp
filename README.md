# Video Annotator

A resume-friendly full-stack video annotation application built with React and Node.js. Capture video frames, annotate them with drawing and text tools, and save annotations with timeline markers for easy navigation.

## 🎯 Project Overview

This project demonstrates full-stack development skills with:
- **Frontend**: React (JavaScript) with Vite, custom video player with HTML5 Canvas
- **Backend**: Express.js with RESTful API
- **Storage**: Local filesystem with lightweight JSON database (lowdb)
- **Features**: Frame capture, annotation editor, timeline markers, thumbnail previews

## 📋 Tech Stack

- **Frontend**: React 18, Vite, Axios, Tailwind CSS
- **Backend**: Node.js, Express, Multer (file uploads), Sharp (thumbnails), Lowdb
- **Testing**: Jest, React Testing Library, Supertest

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd video-annotator
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # In server directory
   cp .env.example .env
   ```

4. **Seed the database with sample data**
   ```bash
   cd server
   npm run seed
   ```

5. **Start the application**
   
   **Option 1: Run from root (both servers)**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```
   
   **Option 2: Individual commands**
   ```bash
   # Backend (from server directory)
   npm run dev
   
   # Frontend (from client directory)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🎬 How to Use

1. **Load Video**: The sample video loads automatically from the seed data
2. **Play/Pause**: Use spacebar or the play button
3. **Seek**: Click the progress bar or use left/right arrow keys (±5s)
4. **Annotate**: Click "Annotate" button or press 'A' to capture current frame
5. **Draw**: Use pen tool to draw freehand annotations
6. **Add Text**: Click text tool, then click on canvas to add text labels
7. **Save**: Click Save to store annotation with timestamp
8. **View Annotations**: Click timeline markers to view saved annotations
9. **Hover Markers**: Hover over timeline dots to see thumbnail preview

## 🧪 Running Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📁 Project Structure

```
video-annotator/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Video player, annotation editor, timeline
│   │   ├── services/      # API client (Axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── db.js         # Lowdb setup
│   │   └── server.js     # Express app
│   ├── storage/          # File storage (gitignored)
│   ├── seed.js           # Database seeding script
│   └── package.json
└── README.md
```

## 🗄️ Database & Storage

This project uses **lowdb** (lightweight JSON database) to avoid requiring MongoDB for local development.

- **Metadata**: Stored in `server/db.json`
- **Images**: Stored in `server/storage/videos/{videoId}/annotations/{annotationId}/`
- **Structure**: Each annotation has `image.png` (full) and `thumb.png` (thumbnail)

### Swapping to MongoDB (Optional)

To use MongoDB in production:

1. Install mongoose: `npm install mongoose`
2. Replace lowdb initialization in `server/src/db.js`
3. Create Mongoose schema for annotations
4. Update CRUD operations in routes to use Mongoose methods

Example schema:
```javascript
const AnnotationSchema = new mongoose.Schema({
  id: String,
  videoId: String,
  timestamp_ms: Number,
  timecode: String,
  image_path: String,
  thumb_path: String,
  notes: String,
  created_at: Date
});
```

## 🎤 Interview Script (2-3 minutes)

### Introduction
"I built a Video Annotator application that demonstrates my full-stack development skills. It's a tool that allows users to capture frames from a video, annotate them with drawings and text, and save those annotations with timeline markers."

### Technical Stack
"On the frontend, I used React with JavaScript and Vite for fast development. The video player is a custom HTML5 component with keyboard shortcuts and a custom progress bar. For the annotation editor, I used the native Canvas API to keep it lightweight and easy to explain."

### Key Features Walkthrough
"The core workflow is simple but powerful:
1. When you click 'Annotate', the video pauses and captures the current frame using Canvas drawImage()
2. A modal opens with annotation tools - a pen for freehand drawing with different stroke widths, and a text tool for adding labels
3. When you save, the annotated image is sent to the backend via multipart form-data using Axios
4. The backend, built with Express, saves the image to the filesystem, generates a thumbnail using Sharp, and stores metadata in a lightweight JSON database called lowdb"

### Architecture Decisions
"I chose lowdb instead of MongoDB to make the project easy to run locally without requiring database installation. For a recruiter or interviewer, they can just npm install and run. But I documented how to swap to MongoDB for production use."

### Timeline Feature
"One of the cool features is the timeline markers. After saving an annotation, a dot appears on the progress bar at that exact timestamp. Hovering shows a thumbnail preview, and clicking seeks to that moment and displays the full annotation. This required calculating pixel positions based on video duration and implementing hover/click event handlers."

### Testing & Code Quality
"I included unit tests for both frontend and backend - testing the API routes with Supertest and React components with React Testing Library. The code is clean, well-commented, and uses consistent ES6+ JavaScript throughout."

### Challenges & Solutions
"The most interesting challenge was capturing video frames at the exact moment. I had to ensure the video was paused before drawing to canvas, and handle edge cases like seeking while the video is loading. I also implemented proper focus management for the modal using React refs and keyboard event handlers."

### Conclusion
"This project showcases my ability to build a complete full-stack application from scratch, work with media APIs, implement intuitive UX patterns, and write maintainable, testable code. The repository includes comprehensive documentation and is structured like a production codebase."

## 🔑 API Endpoints

### Annotations
- `POST /api/videos/:videoId/annotations` - Create annotation with image upload
- `GET /api/videos/:videoId/annotations` - List all annotations for video
- `GET /api/videos/:videoId/annotations/:annotationId` - Get single annotation
- `DELETE /api/videos/:videoId/annotations/:annotationId` - Delete annotation

### Static Files
- `GET /storage/*` - Serve annotation images and thumbnails

## 🎨 Features

- ✅ Custom HTML5 video player with controls
- ✅ Keyboard shortcuts (Space: play/pause, A: annotate, Arrow keys: seek)
- ✅ Frame capture at video resolution
- ✅ Annotation editor with pen and text tools
- ✅ Undo and clear functionality
- ✅ Timeline markers with hover previews
- ✅ Thumbnail generation
- ✅ Responsive design
- ✅ Accessible modals with focus trapping
- ✅ RESTful API with proper error handling

## 📝 License

MIT

## 👤 Author

Built as a resume project to demonstrate full-stack development skills.
