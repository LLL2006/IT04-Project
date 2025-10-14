import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../slices/projectSlice";
import uiReducer from "../slices/uiSlice";
import {
  useDispatch, // Hook gốc của React-Redux để gửi (dispatch) actions
  useSelector, // Hook gốc của React-Redux để đọc (select) state
  type TypedUseSelectorHook, // Công cụ của TypeScript để tạo ra một hook `useSelector` đã được định kiểu
} from "react-redux";

// `configureStore` là hàm chính từ Redux Toolkit để tạo ra Redux store.
export const store = configureStore({
  reducer: {
    projects: projectReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
