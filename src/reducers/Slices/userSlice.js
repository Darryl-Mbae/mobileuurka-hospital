
// slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  onlineUsers: [], // Array of user IDs who are online
  users: [], // All users list
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setOnlineUsers: (state, action) => {
      // For backward compatibility - just user IDs
      state.onlineUsers = action.payload;
    },
    userWentOffline: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    updateUser: (state, action) => {
      const updatedUser = action.payload;
      // Update in users array
      const userIndex = state.users.findIndex(user => user.id === updatedUser.id);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updatedUser };
      }
      // Update current user if it's the same user
      if (state.currentUser && state.currentUser.id === updatedUser.id) {
        state.currentUser = { ...state.currentUser, ...updatedUser };
      }
    },
    addUser: (state, action) => {
      const newUser = action.payload;
      // Check if user already exists to avoid duplicates
      const existingUserIndex = state.users.findIndex(user => user.id === newUser.id);
      if (existingUserIndex === -1) {
        state.users.push(newUser);
      }
    },
    deleteUser: (state, action) => {
      const userId = action.payload.id || action.payload;
      state.users = state.users.filter(user => user.id !== userId);
      // Remove from online users if they were online
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.onlineUsers = [];
    },
  },
});

export const { 
  setUser, 
  setUsers, 
  setOnlineUsers, 
  userWentOffline,
  updateUser,
  addUser,
  deleteUser,
  logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
