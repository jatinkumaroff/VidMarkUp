import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

import playerReducer     from "./playerSlice";
import markersReducer    from "./markersSlice";
import uiReducer         from "./uiSlice";
import captureReducer    from "./captureSlice";
import whiteboardReducer from "./whiteboardSlice";

export const store = configureStore({
  reducer: {
    player:     playerReducer,
    markers:    markersReducer,
    ui:         uiReducer,
    capture:    captureReducer,
    whiteboard: whiteboardReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

export const useAppDispatch = () => useDispatch();
export const useAppSelector = (selector) => useSelector(selector);
