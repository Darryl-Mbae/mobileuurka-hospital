// Debug utility to check online users functionality
import { store } from '../config/store.js';

export const debugOnlineUsers = () => {
  const state = store.getState();
  
  console.log('=== Online Users Debug Info ===');
  console.log('Socket connected:', state.socket.isConnected);
  console.log('Socket status:', state.socket.connectionStatus);
  console.log('Socket error:', state.socket.lastError);
  
  console.log('\n--- User State ---');
  console.log('Current user:', state.user.currentUser);
  console.log('Total users:', state.user.users.length);
  console.log('Online users (backward compatibility):', state.user.onlineUsers);
  console.log('Online users by organization:', state.user.onlineUsersByOrganization);
  console.log('Online counts by organization:', state.user.onlineCountsByOrganization);
  
  console.log('\n--- Organization State ---');
  console.log('Organizations:', state.organisation.organisations.length);
  
  // Check if current user has organizations
  const currentUser = state.user.currentUser;
  if (currentUser) {
    console.log('Current user organizations:', currentUser.organizationId || 'None');
  }
  
  // Check if online users array contains current user
  if (currentUser && state.user.onlineUsers.includes(currentUser.id)) {
    console.log('✅ Current user is in online users list');
  } else {
    console.log('❌ Current user is NOT in online users list');
  }
  
  console.log('=== End Debug Info ===');
};

// Function to manually request online users
export const requestOnlineUsersDebug = () => {
  const socketManager = window.socketManager; // Assuming it's available globally
  if (socketManager) {
    console.log('Requesting online users...');
    socketManager.requestOnlineUsers();
    socketManager.requestOnlineCounts();
  } else {
    console.log('Socket manager not available');
  }
};

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  window.debugOnlineUsers = debugOnlineUsers;
  window.requestOnlineUsersDebug = requestOnlineUsersDebug;
}