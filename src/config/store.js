
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducers/Slices/userSlice.js";
import organisationReducer from "../reducers/Slices/organizationSlice.js";
import patientReducer from "../reducers/Slices/patientsSlice.js";
import socketReducer from "../reducers/Slices/socketSlice.js";
import chatsReducer from "../reducers/Slices/chatSlice.js";

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
