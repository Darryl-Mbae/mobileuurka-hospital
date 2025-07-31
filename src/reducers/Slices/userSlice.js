
// slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  onlineUsers: [], // Array of user IDs who are online (backward compatibility)
  onlineUsersByOrganization: {}, // Object mapping organization IDs to arrays of online user IDs
  onlineCountsByOrganization: {}, // Object mapping organization IDs to online user counts
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
    setOnlineUsersByOrganization: (state, action) => {
      // Set online users for a specific organization
      // Payload: { organizationId: string, userIds: string[] }
      const { organizationId, userIds } = action.payload;
      state.onlineUsersByOrganization[organizationId] = userIds;
    },
    setAllOnlineUsersByOrganization: (state, action) => {
      // Set all organization online users at once
      // Payload: { [organizationId]: userIds[] }
      state.onlineUsersByOrganization = action.payload;
    },
    addOnlineUserToOrganization: (state, action) => {
      // Add a user to online list for a specific organization
      // Payload: { organizationId: string, userId: string }
      const { organizationId, userId } = action.payload;
      if (!state.onlineUsersByOrganization[organizationId]) {
        state.onlineUsersByOrganization[organizationId] = [];
      }
      if (!state.onlineUsersByOrganization[organizationId].includes(userId)) {
        state.onlineUsersByOrganization[organizationId].push(userId);
      }
    },
    removeOnlineUserFromOrganization: (state, action) => {
      // Remove a user from online list for a specific organization
      // Payload: { organizationId: string, userId: string }
      const { organizationId, userId } = action.payload;
      if (state.onlineUsersByOrganization[organizationId]) {
        state.onlineUsersByOrganization[organizationId] = 
          state.onlineUsersByOrganization[organizationId].filter(id => id !== userId);
      }
    },
    setOnlineCountsByOrganization: (state, action) => {
      // Set online counts for organizations
      // Payload: { [organizationId]: count }
      state.onlineCountsByOrganization = action.payload;
    },
    updateOnlineCountForOrganization: (state, action) => {
      // Update online count for a specific organization
      // Payload: { organizationId: string, count: number }
      const { organizationId, count } = action.payload;
      state.onlineCountsByOrganization[organizationId] = count;
    },
    userWentOffline: (state, action) => {
      const { userId } = action.payload;
      // Remove from backward compatibility array
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      
      // Remove from all organization online user lists
      Object.keys(state.onlineUsersByOrganization).forEach(orgId => {
        state.onlineUsersByOrganization[orgId] = 
          state.onlineUsersByOrganization[orgId].filter(id => id !== userId);
      });
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
      state.onlineUsersByOrganization = {};
      state.onlineCountsByOrganization = {};
    },
  },
});

export const { 
  setUser, 
  setUsers, 
  setOnlineUsers, 
  setOnlineUsersByOrganization,
  setAllOnlineUsersByOrganization,
  addOnlineUserToOrganization,
  removeOnlineUserFromOrganization,
  setOnlineCountsByOrganization,
  updateOnlineCountForOrganization,
  userWentOffline,
  updateUser,
  addUser,
  deleteUser,
  logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
