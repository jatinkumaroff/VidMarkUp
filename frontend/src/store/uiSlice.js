import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    isModalOpen: false,
    modalType: null,
    modalPayload: null,
    isViewModalOpen: false,
    viewModalPayload: null,
    isFullscreen: false,
  },
  reducers: {
    openModal: (state, action) => {
      state.isModalOpen = true;
      state.modalType = action.payload.type;
      state.modalPayload = action.payload.payload ?? null;
    },
    closeModal: (state) => {
      state.isModalOpen = false;
      state.modalType = null;
      state.modalPayload = null;
    },
    openViewModal: (state, action) => {
      state.isViewModalOpen = true;
      state.viewModalPayload = action.payload ?? null;
    },
    closeViewModal: (state) => {
      state.isViewModalOpen = false;
      state.viewModalPayload = null;
    },
    toggleFullscreen: (state) => { state.isFullscreen = !state.isFullscreen; },
    setFullscreen: (state, action) => { state.isFullscreen = action.payload; },
  },
});

export const {
  openModal, closeModal,
  openViewModal, closeViewModal,
  toggleFullscreen, setFullscreen,
} = uiSlice.actions;

export const selectIsModalOpen      = (state) => state.ui.isModalOpen;
export const selectModalType        = (state) => state.ui.modalType;
export const selectModalPayload     = (state) => state.ui.modalPayload;
export const selectIsViewModalOpen  = (state) => state.ui.isViewModalOpen;
export const selectViewModalPayload = (state) => state.ui.viewModalPayload;
export const selectIsFullscreen     = (state) => state.ui.isFullscreen;

export default uiSlice.reducer;
