import { createSlice } from "@reduxjs/toolkit";

const captureSlice = createSlice({
  name: "capture",
  initialState: {
    frameUrl: null,
    frameTime: null,
    frameWidth: 0,
    frameHeight: 0,
    status: "idle", // 'idle' | 'done'
  },
  reducers: {
    captureSuccess: (state, action) => {
      // payload: { url, time, width, height }
      state.frameUrl    = action.payload.url;
      state.frameTime   = action.payload.time;
      state.frameWidth  = action.payload.width;
      state.frameHeight = action.payload.height;
      state.status      = "done";
    },
    clearCapture: (state) => {
      // revoke blob URL before clearing to avoid memory leak
      state.frameUrl    = null;
      state.frameTime   = null;
      state.frameWidth  = 0;
      state.frameHeight = 0;
      state.status      = "idle";
    },
  },
});

export const { captureSuccess, clearCapture } = captureSlice.actions;

export const selectFrameUrl    = (state) => state.capture.frameUrl;
export const selectFrameTime   = (state) => state.capture.frameTime;
export const selectFrameWidth  = (state) => state.capture.frameWidth;
export const selectFrameHeight = (state) => state.capture.frameHeight;

export default captureSlice.reducer;