// slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  onlineUsers: [], // Array of user IDs who are online
  onlineUsersDetailed: [], // Detailed online users data from socket
  users: [], // All users list
  typingUsers: [], // Users currently typing
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
    setOnlineUsersDetailed: (state, action) => {
      // Detailed online users data from socket
      state.onlineUsersDetailed = action.payload;
      // Also update simple online users array for backward compatibility
      state.onlineUsers = action.payload.map(user => user.userId);
    },
    userCameOnline: (state, action) => {
      const { userId } = action.payload;
      if (!state.onlineUsers.includes(userId)) {
        state.onlineUsers.push(userId);
      }
    },
    userWentOffline: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      state.onlineUsersDetailed = state.onlineUsersDetailed.filter(user => user.userId !== userId);
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
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      const { userId, context, contextId } = action.payload;
      const existingIndex = state.typingUsers.findIndex(
        user => user.userId === userId && user.context === context && user.contextId === contextId
      );
      if (existingIndex === -1) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action) => {
      const { userId, context, contextId } = action.payload;
      state.typingUsers = state.typingUsers.filter(
        user => !(user.userId === userId && user.context === context && user.contextId === contextId)
      );
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.onlineUsers = [];
      state.onlineUsersDetailed = [];
      state.typingUsers = [];
    },
  },
});

export const { 
  setUser, 
  setUsers, 
  setOnlineUsers, 
  setOnlineUsersDetailed,
  userCameOnline,
  userWentOffline,
  updateUser,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
