import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const savePlaybackPosition = createAsyncThunk(
  "player/savePlaybackPosition",
  async ({ videoId, time }, { rejectWithValue }) => {
    try {
      // await api.post(`/videos/${videoId}/position`, { time });
      return { videoId, time };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const playerSlice = createSlice({
  name: "player",
  initialState: {
    videoId: null,       // MongoDB _id — set this when you load a video
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isBuffering: false,
    src: "",
  },
  reducers: {
    setVideoId: (state, action) => { state.videoId = action.payload; },
    play: (state) => { state.isPlaying = true; },
    pause: (state) => { state.isPlaying = false; },
    togglePlay: (state) => { state.isPlaying = !state.isPlaying; },
    setCurrentTime: (state, action) => { state.currentTime = action.payload; },
    setDuration: (state, action) => { state.duration = action.payload; },
    setProgress: (state, action) => { state.progress = action.payload; },
    setVolume: (state, action) => { state.volume = action.payload; },
    toggleMute: (state) => { state.isMuted = !state.isMuted; },
    setPlaybackRate: (state, action) => { state.playbackRate = action.payload; },
    setSource: (state, action) => {
      state.src = action.payload;
      state.currentTime = 0;
      state.progress = 0;
      state.isPlaying = false;
    },
    setBuffering: (state, action) => { state.isBuffering = action.payload; },
  },
});

export const {
  setVideoId,
  play, pause, togglePlay,
  setCurrentTime, setDuration, setProgress,
  setVolume, toggleMute, setPlaybackRate,
  setSource, setBuffering,
} = playerSlice.actions;

export const selectVideoId      = (state) => state.player.videoId;
export const selectIsPlaying    = (state) => state.player.isPlaying;
export const selectCurrentTime  = (state) => state.player.currentTime;
export const selectDuration     = (state) => state.player.duration;
export const selectProgress     = (state) => state.player.progress;
export const selectVolume       = (state) => state.player.volume;
export const selectIsMuted      = (state) => state.player.isMuted;
export const selectPlaybackRate = (state) => state.player.playbackRate;
export const selectIsBuffering  = (state) => state.player.isBuffering;
export const selectSrc          = (state) => state.player.src;

export default playerSlice.reducer;