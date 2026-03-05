import { createSlice } from "@reduxjs/toolkit";

const whiteboardSlice = createSlice({
  name: "whiteboard",
  initialState: {
    isOpen: false,
    assets: {},        // { [id]: { id, url, width, height } }
    selectedTool: null,
    selectedShapeId: null,
  },
  reducers: {
    openWhiteboard: (state) => { state.isOpen = true; },
    closeWhiteboard: (state) => { state.isOpen = false; },
    addAsset: (state, action) => {
      const asset = action.payload; // { id, url, width, height }
      state.assets[asset.id] = asset;
    },
    removeAsset: (state, action) => { delete state.assets[action.payload]; },
    setSelectedTool: (state, action) => { state.selectedTool = action.payload; },
    selectShape: (state, action) => { state.selectedShapeId = action.payload; },
    deselectShape: (state) => { state.selectedShapeId = null; },
    clearAssets: (state) => { state.assets = {}; },
  },
});

export const {
  openWhiteboard, closeWhiteboard,
  addAsset, removeAsset, clearAssets,
  setSelectedTool, selectShape, deselectShape,
} = whiteboardSlice.actions;

export const selectIsWhiteboardOpen = (state) => state.whiteboard.isOpen;
export const selectAssets           = (state) => state.whiteboard.assets;
export const selectAssetsArray      = (state) => Object.values(state.whiteboard.assets);
export const selectSelectedTool     = (state) => state.whiteboard.selectedTool;
export const selectSelectedShapeId  = (state) => state.whiteboard.selectedShapeId;

export default whiteboardSlice.reducer;
