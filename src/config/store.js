import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../realtime/Slices/userSlice.js";
import organisationReducer from "../realtime/Slices/organizationSlice";
import patientReducer from "../realtime/Slices/patientsSlice";
import socketReducer from "../realtime/Slices/socketSlice";
import chatsReducer from "../realtime/Slices/chatSlice";


export const store = configureStore({
  reducer: {
    user: userReducer,
    organisation: organisationReducer,
    patient: patientReducer,
    socket: socketReducer,
    chats: chatsReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
