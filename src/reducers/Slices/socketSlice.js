
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
  reconnectAttempts: 0,
  lastError: null,
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
      state.isConnected = true;
      state.connectionStatus = 'connected';
      state.reconnectAttempts = 0;
      state.lastError = null;
    },
    setConnecting: (state) => {
      state.connectionStatus = 'connecting';
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
    resetSocket: (state) => {
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
    setConnectionError: (state, action) => {
      state.connectionStatus = 'error';
      state.lastError = action.payload;
      state.reconnectAttempts += 1;
    },
    clearError: (state) => {
      state.lastError = null;
    },
  },
});

export const { 
  setSocket, 
  setConnecting,
  disconnectSocket, 
  resetSocket, 
  setConnectionError,
  clearError 
} = socketSlice.actions;

export default socketSlice.reducer;
