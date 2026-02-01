# Video Annotator - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend (in a new terminal)
cd client
npm install
```

### Step 2: Seed the Database

```bash
cd server
npm run seed
```

This creates a sample video entry with Big Buck Bunny (a public domain video).

### Step 3: Start the Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server will start on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client will start on http://localhost:5173

### Step 4: Use the Application

1. Open http://localhost:5173 in your browser
2. The sample video loads automatically
3. Click **Play** or press **Space** to start
4. Click **Annotate** or press **A** to capture a frame
5. Draw on the image with the pen tool or add text labels
6. Click **Save** to store the annotation
7. Click the green markers on the timeline to view saved annotations

## 📝 Features to Try

- **Drawing**: Select pen tool, choose thickness, draw on the frame
- **Text**: Select text tool, click on canvas, type your text
- **Undo**: Remove the last action
- **Clear**: Reset to original captured frame
- **Timeline Markers**: Hover to see thumbnail, click to view full annotation
- **Keyboard Shortcuts**: 
  - Space: Play/Pause
  - A: Annotate
  - ← →: Seek ±5 seconds
  - Escape: Close modals

## 🧪 Run Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🎯 Project Highlights for Interviews

**Frontend Skills:**
- Custom video player with HTML5 Canvas
- React hooks (useState, useRef, useEffect)
- Modal management and focus trapping
- Canvas API for drawing annotations
- Event handling and keyboard shortcuts
- Responsive Tailwind CSS design

**Backend Skills:**
- RESTful API with Express
- File uploads with Multer
- Image processing with Sharp
- Lightweight JSON database (lowdb)
- Error handling and validation
- Clean code structure

**Full-Stack Integration:**
- Axios for HTTP requests with multipart/form-data
- Real-time UI updates after API calls
- File serving with Express static middleware
- CORS configuration
- Environment variables

## 📦 What You Can Say in Interviews

"I built a full-stack video annotation tool where users can pause a video, capture the current frame, annotate it with drawing and text tools, and save it with a timeline marker. 

On the frontend, I used React with a custom HTML5 video player and Canvas API for annotations. The backend is Express with a lightweight JSON database, making it easy to run locally without MongoDB.

The most interesting challenges were capturing video frames accurately, implementing the drawing tools with Canvas, and calculating pixel positions for timeline markers based on video duration.

The project demonstrates my ability to work with media APIs, build intuitive user interfaces, and create a complete full-stack application from scratch."

## 🔧 Troubleshooting

**Port already in use?**
- Change PORT in `server/.env` 
- Update proxy in `client/vite.config.js`

**CORS errors?**
- Ensure CLIENT_URL in `server/.env` matches your frontend URL

**Video won't load?**
- Check your internet connection (uses external video URL)
- Try a different video URL in seed.js

## 📚 Next Steps

Want to enhance the project? Consider:
- Adding user authentication
- Implementing annotation editing
- Adding export to ZIP functionality
- Deploying to a cloud platform
- Swapping lowdb for MongoDB
- Adding more drawing tools (shapes, colors)

Happy coding! 🎉
