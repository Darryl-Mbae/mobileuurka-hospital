/**
 * Authentication and Socket Synchronization Utility
 * Ensures socket connection stays in sync with authentication state
 */

import socketManager from '../config/socket.js';

class AuthSocketSync {
  constructor() {
    this.currentToken = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the sync utility
   */
  init() {
    if (this.isInitialized) return;
    
    this.currentToken = localStorage.getItem('access_token');
    this.setupTokenWatcher();
    this.isInitialized = true;
    
    console.log('🔄 Auth-Socket sync initialized');
  }

  /**
   * Setup token change watcher
   */
  setupTokenWatcher() {
    // Watch for localStorage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'access_token') {
        this.handleTokenChange(e.newValue);
      }
    });

    // Watch for direct token changes in the same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key === 'access_token' && value !== this.currentToken) {
        this.handleTokenChange(value);
      }
      originalSetItem.call(localStorage, key, value);
    };

    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = (key) => {
      if (key === 'access_token') {
        this.handleTokenChange(null);
      }
      originalRemoveItem.call(localStorage, key);
    };
  }

  /**
   * Handle token changes
   */
  handleTokenChange(newToken) {
    console.log('🔑 Token change detected:', {
      hadToken: !!this.currentToken,
      hasToken: !!newToken,
      tokenChanged: this.currentToken !== newToken
    });

    const oldToken = this.currentToken;
    this.currentToken = newToken;

    // If token was removed or changed, disconnect socket
    if (oldToken && (!newToken || oldToken !== newToken)) {
      console.log('🔌 Disconnecting socket due to token change');
      socketManager.disconnect();
    }

    // If new token is available, reconnect socket
    if (newToken && newToken !== oldToken) {
      console.log('🔄 Reconnecting socket with new token');
      setTimeout(() => {
        socketManager.connect(newToken);
      }, 1000); // Small delay to ensure token is properly set
    }
  }

  /**
   * Force socket reconnection with current token
   */
  forceReconnect() {
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('🔄 Force reconnecting socket');
      socketManager.disconnect();
      setTimeout(() => {
        socketManager.connect(token);
      }, 1000);
    }
  }

  /**
   * Check if socket and auth are in sync
   */
  checkSync() {
    const currentToken = localStorage.getItem('access_token');
    const socketConnected = socketManager.isConnected();
    
    return {
      hasToken: !!currentToken,
      socketConnected,
      inSync: (!!currentToken && socketConnected) || (!currentToken && !socketConnected)
    };
  }
}

export const authSocketSync = new AuthSocketSync();
export default authSocketSync;