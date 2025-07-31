// Simple test utility to verify online users functionality
import { store } from '../config/store.js';
import socketManager from '../config/socket.js';

export const testOnlineUsers = () => {
  console.log('=== Online Users Test ===');
  
  const state = store.getState();
  
  // Test 1: Check socket connection
  console.log('1. Socket Connection:');
  console.log('   - Connected:', socketManager.isConnected());
  console.log('   - Status:', state.socket.connectionStatus);
  console.log('   - Error:', state.socket.lastError);
  
  // Test 2: Check current user
  console.log('2. Current User:');
  console.log('   - User:', state.user.currentUser?.name || 'None');
  console.log('   - User ID:', state.user.currentUser?.id || 'None');
  console.log('   - Organization:', state.user.currentUser?.organizationId || 'None');
  
  // Test 3: Check online users data
  console.log('3. Online Users Data:');
  console.log('   - Online users array:', state.user.onlineUsers);
  console.log('   - Online users by org:', state.user.onlineUsersByOrganization);
  console.log('   - Online counts by org:', state.user.onlineCountsByOrganization);
  
  // Test 4: Check if current user is in online list
  const currentUserId = state.user.currentUser?.id;
  const isCurrentUserOnline = currentUserId && state.user.onlineUsers.includes(currentUserId);
  console.log('4. Current User Online Status:');
  console.log('   - Current user ID:', currentUserId);
  console.log('   - Is in online list:', isCurrentUserOnline);
  
  // Test 5: Check users data structure
  console.log('5. Users Data:');
  console.log('   - Total users:', state.user.users.length);
  console.log('   - Sample user IDs:', state.user.users.slice(0, 3).map(u => ({ id: u.id, name: u.name })));
  
  // Test 6: Manual request
  console.log('6. Manual Request:');
  if (socketManager.isConnected()) {
    console.log('   - Requesting online users...');
    socketManager.requestOnlineUsers();
    socketManager.requestOnlineCounts();
  } else {
    console.log('   - Socket not connected, cannot request');
  }
  
  console.log('=== End Test ===');
};

// Make available globally for console debugging
if (typeof window !== 'undefined') {
  window.testOnlineUsers = testOnlineUsers;
}