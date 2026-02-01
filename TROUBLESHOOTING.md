# Troubleshooting Guide

## Issue: Annotate Button Pauses Video But Modal Doesn't Open

### Symptoms
- Clicking "Annotate" button pauses the video
- No modal appears
- Console may show errors

### Root Causes & Solutions

#### 1. CORS Issues with External Videos
**Problem**: Videos from external URLs may block canvas capture due to CORS restrictions.

**Solution**: Added `crossOrigin="anonymous"` to video element.

```jsx
<video
  ref={videoRef}
  src={videoUrl}
  crossOrigin="anonymous"  // <-- This fixes CORS
  // ... other props
/>
```

#### 2. Video Not Fully Loaded
**Problem**: Trying to capture frame before video metadata is loaded.

**Solution**: Check `video.readyState` before capturing.

```javascript
if (video.readyState < 2) {
  alert('Video is still loading. Please wait a moment and try again.');
  return;
}
```

#### 3. Canvas Capture Failures
**Problem**: Silent failures when capturing video frame.

**Solution**: Added comprehensive error handling:

```javascript
try {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  if (canvas.width === 0 || canvas.height === 0) {
    alert('Unable to capture frame. Video dimensions are invalid.');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Failed to capture frame. Please try again.');
      return;
    }
    // Continue with blob...
  }, 'image/png');
} catch (error) {
  console.error('Error capturing frame:', error);
  alert('Failed to capture frame: ' + error.message);
}
```

### Debugging Steps

1. **Open Browser Console** (F12 or Cmd+Option+I)
   - Look for errors when clicking Annotate
   - Check for CORS errors
   - Look for canvas-related errors

2. **Check Debug Info** (Development Mode Only)
   - Below the Annotate button, you'll see: "Editor: Open/Closed | Frame: Yes/No"
   - This shows the current state

3. **Console Logs Added**
   ```
   - "Editor state: { showEditor: true, capturedFrame: true }"
   - "AnnotationEditor mounted"
   - "Image loaded successfully"
   ```

4. **Wait for Video to Load**
   - Let the video play for a few seconds before clicking Annotate
   - The video needs to fully load metadata

### Common Issues & Quick Fixes

#### Issue: "Tainted canvas" Error
**Cause**: CORS blocking canvas export
**Fix**: Video element now has `crossOrigin="anonymous"`

#### Issue: Black Canvas
**Cause**: Video not ready
**Fix**: Wait 1-2 seconds after video loads, then click Annotate

#### Issue: Modal Opens But Canvas is Blank
**Cause**: Image loading failed
**Fix**: Check console for image load errors

#### Issue: Browser Compatibility
**Supported Browsers**:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Not Supported**:
- IE11 (lacks Canvas support)
- Very old mobile browsers

### Testing the Fix

1. **Restart Development Server**
   ```bash
   # Stop current server (Ctrl+C)
   cd client
   npm run dev
   ```

2. **Clear Browser Cache**
   - Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   - Or use Incognito/Private browsing

3. **Test Workflow**
   ```
   1. Load page
   2. Let video play for 2-3 seconds
   3. Click Annotate button
   4. Modal should open with captured frame
   ```

### Alternative Video Sources

If the default video doesn't work, try these CORS-friendly videos:

```javascript
// In seed.js, replace the URL with:
url: 'https://www.w3schools.com/html/mov_bbb.mp4'
// or
url: 'https://download.blender.org/demo/movies/BBB/bbb_sunflower_1080p_30fps_normal.mp4'
```

### Advanced Debugging

#### Enable Verbose Logging

Add to VideoPlayer.jsx:
```javascript
useEffect(() => {
  console.log('Video state:', {
    readyState: videoRef.current?.readyState,
    videoWidth: videoRef.current?.videoWidth,
    videoHeight: videoRef.current?.videoHeight,
    currentTime: videoRef.current?.currentTime
  });
}, [currentTime]);
```

#### Check Video Properties

In browser console:
```javascript
const video = document.querySelector('video');
console.log({
  readyState: video.readyState,
  width: video.videoWidth,
  height: video.videoHeight,
  crossOrigin: video.crossOrigin
});
```

### If Issue Persists

1. **Check Network Tab** (Browser DevTools)
   - Verify video loads successfully
   - Check for 403/CORS errors

2. **Try Local Video**
   - Download a video file
   - Place in `client/public/sample.mp4`
   - Update seed.js: `url: '/sample.mp4'`

3. **Verify Dependencies**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check React DevTools**
   - Install React DevTools extension
   - Verify state updates when clicking Annotate

### Contact & Support

If you're still having issues:
1. Check console for specific error messages
2. Note your browser and version
3. Try in a different browser
4. Ensure you're using Node 16+

### Fixed Files in Latest Update

- ✅ `client/src/components/VideoPlayer.jsx` - Better error handling
- ✅ `client/src/components/AnnotationEditor.jsx` - Image load error handling
- ✅ Video element now has CORS support
- ✅ Debug info added for development
- ✅ Loading indicators added

All fixes are included in the updated ZIP and TAR.GZ files!
