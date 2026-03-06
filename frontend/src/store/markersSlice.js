import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";

const markersAdapter = createEntityAdapter({
  selectId: (marker) => marker._id,
});

export const fetchMarkers = createAsyncThunk(
  "markers/fetchMarkers",
  async ({ videoId }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/markers?videoId=${videoId}`);
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const markersSlice = createSlice({
  name: "markers",
  initialState: markersAdapter.getInitialState({
    selectedMarkerId: null,
    editingMarkerId: null,
    loading: false,
    error: null,
  }),
  reducers: {
    selectMarker: (state, action) => {
      state.selectedMarkerId = action.payload;
    },
    clearSelectedMarker: (state) => {
      state.selectedMarkerId = null;
    },
    startEditingMarker: (state, action) => {
      state.editingMarkerId = action.payload;
    },
    stopEditingMarker: (state) => {
      state.editingMarkerId = null;
    },
    setMarkersLocal: (state, action) => {
      markersAdapter.setAll(state, action.payload);
    },
    // FIX: Added clearMarkers so it exists when your other files call it
    clearMarkers: (state) => {
      markersAdapter.removeAll(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarkers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarkers.fulfilled, (state, action) => {
        state.loading = false;
        markersAdapter.setAll(state, action.payload);
      })
      .addCase(fetchMarkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  selectMarker,
  clearSelectedMarker,
  startEditingMarker,
  stopEditingMarker,
  setMarkersLocal,
  // FIX: Exported clearMarkers to resolve the SyntaxError
  clearMarkers,
} = markersSlice.actions;

const selectMarkersState = (state) => state.markers;

export const { selectAll: selectAllMarkers, selectById: selectMarkerById } =
  markersAdapter.getSelectors(selectMarkersState);

export const selectSelectedMarkerId = (state) => state.markers.selectedMarkerId;
export const selectEditingMarkerId = (state) => state.markers.editingMarkerId;
export const selectMarkersLoading = (state) => state.markers.loading;
export const selectMarkersError = (state) => state.markers.error;

// Kept exactly as your original code so you don't have to change any components
export const selectMarkersForRange = (start, end) =>
  createSelector(selectAllMarkers, (markers) =>
    markers.filter((m) => m.timestamp >= start && m.timestamp <= end),
  );

export default markersSlice.reducer;



// //the above file is moddified by gemini, this was the oriinal file:import { createSlice, createAsyncThunk, createEntityAdapter, createSelector } from "@reduxjs/toolkit";

// const markersAdapter = createEntityAdapter({
//   selectId: (marker) => marker._id,
// });

// export const fetchMarkers = createAsyncThunk(
//   "markers/fetchMarkers",
//   async ({ videoId }, { rejectWithValue }) => {
//     try {
//       const res = await fetch(`/api/markers?videoId=${videoId}`);
//       return await res.json();
//     } catch (err) {
//       return rejectWithValue(err.message);
//     }
//   }
// );

// const markersSlice = createSlice({
//   name: "markers",
//   initialState: markersAdapter.getInitialState({
//     selectedMarkerId: null,
//     editingMarkerId: null,
//     loading: false,
//     error: null,
//   }),
//   reducers: {
//     selectMarker: (state, action) => { state.selectedMarkerId = action.payload; },
//     clearSelectedMarker: (state) => { state.selectedMarkerId = null; },
//     startEditingMarker: (state, action) => { state.editingMarkerId = action.payload; },
//     stopEditingMarker: (state) => { state.editingMarkerId = null; },
//     setMarkersLocal: (state, action) => { markersAdapter.setAll(state, action.payload); },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchMarkers.pending, (state) => { state.loading = true; state.error = null; })
//       .addCase(fetchMarkers.fulfilled, (state, action) => {
//         state.loading = false;
//         markersAdapter.setAll(state, action.payload);
//       })
//       .addCase(fetchMarkers.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
//   },
// });

// export const {
//   selectMarker, clearSelectedMarker,
//   startEditingMarker, stopEditingMarker,
//   setMarkersLocal,
// } = markersSlice.actions;

// const selectMarkersState = (state) => state.markers;

// export const {
//   selectAll: selectAllMarkers,
//   selectById: selectMarkerById,
// } = markersAdapter.getSelectors(selectMarkersState);

// export const selectSelectedMarkerId = (state) => state.markers.selectedMarkerId;
// export const selectEditingMarkerId  = (state) => state.markers.editingMarkerId;
// export const selectMarkersLoading   = (state) => state.markers.loading;
// export const selectMarkersError     = (state) => state.markers.error;

// export const selectMarkersForRange = (start, end) =>
//   createSelector(selectAllMarkers, (markers) =>
//     markers.filter((m) => m.timestamp >= start && m.timestamp <= end)
//   );

// export default markersSlice.reducer;