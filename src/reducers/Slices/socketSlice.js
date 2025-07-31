
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
  reconnectAttempts: 0,
  lastError: null,
  connectionHealth: 'unknown', // 'good', 'poor', 'bad', 'unknown'
  isReconnecting: false,
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
      state.connectionHealth = 'good';
      state.isReconnecting = false;
    },
    setConnecting: (state) => {
      state.connectionStatus = 'connecting';
      state.isReconnecting = true;
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
      state.connectionHealth = 'unknown';
      state.isReconnecting = false;
    },
    resetSocket: (state) => {
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
      state.connectionHealth = 'unknown';
      state.isReconnecting = false;
    },
    setConnectionError: (state, action) => {
      state.connectionStatus = 'error';
      state.lastError = action.payload;
      state.connectionHealth = state.reconnectAttempts > 3 ? 'bad' : 'poor';
    },
    clearError: (state) => {
      state.lastError = null;
      if (state.connectionStatus === 'error') {
        state.connectionStatus = 'disconnected';
      }
    },
    setReconnectAttempts: (state, action) => {
      state.reconnectAttempts = action.payload;
    },
    setConnectionHealth: (state, action) => {
      state.connectionHealth = action.payload;
    },
    setReconnecting: (state, action) => {
      state.isReconnecting = action.payload;
    },
  },
});

export const { 
  setSocket, 
  setConnecting,
  disconnectSocket, 
  resetSocket, 
  setConnectionError,
  clearError,
  setReconnectAttempts,
  setConnectionHealth,
  setReconnecting
} = socketSlice.actions;

export default socketSlice.reducer;
