
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  socket: null,
  isConnected: false,
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
      state.isConnected = true;
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.isConnected = false;
    },
    resetSocket: (state) => {
      state.socket = null;
      state.isConnected = false;
    },
  },
});

export const { setSocket, disconnectSocket, resetSocket } = socketSlice.actions;
export default socketSlice.reducer;
