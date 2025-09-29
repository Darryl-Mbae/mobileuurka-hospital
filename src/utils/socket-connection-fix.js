/**
 * Enhanced Socket Connection Utilities
 * Fixes common socket connection issues with authentication and CORS
 */

import io from "socket.io-client";

/**
 * Get authentication token from various sources
 */
export const getAuthToken = () => {
  // Priority 1: localStorage (most reliable for mobile)
  let token = localStorage.getItem('access_token');
  
  // Priority 2: sessionStorage (fallback)
  if (!token) {
    token = sessionStorage.getItem('access_token');
  }
  
  // Priority 3: cookies (web fallback)
  if (!token && document.cookie) {
    const match = document.cookie.match(/access_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }
  
  return token;
};

/**
 * Detect client environment for optimal socket configuration
 */
export const getClientEnvironment = () => {
  const userAgent = navigator.userAgent;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  return {
    isMobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent),
    isIOS: /iPhone|iPad|iPod/.test(userAgent),
    isSlowNetwork: connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData === true
    ),
    connectionType: connection?.effectiveType || 'unknown'
  };
};

/**
 * Create optimized socket configuration based on client environment
 */
export const createSocketConfig = (serverUrl, token) => {
  const env = getClientEnvironment();
  
  console.log('🔧 Socket Environment:', env);
  console.log('🔑 Token available:', !!token);
  console.log('🌐 Server URL:', serverUrl);
  
  // Ensure token is fresh and valid
  if (!token) {
    throw new Error('Authentication token is required for socket connection');
  }
  
  // Base configuration
  const config = {
    // Authentication - secure methods only (no query params)
    auth: {
      token: token
    },
    extraHeaders: {
      'Authorization': `Bearer ${token}`
    },
    
    // Connection options
    forceNew: true,
    autoConnect: true,
    reconnection: false, // We handle reconnection manually
    
    // Timeout settings based on network conditions
    timeout: env.isSlowNetwork ? 90000 : 60000,
    
    // Transport optimization - prioritize polling for ALL mobile devices
    transports: env.isMobile ? ['polling'] : ['websocket', 'polling'],
    upgrade: !env.isMobile, // Disable upgrade for all mobile devices
    rememberUpgrade: false,
    
    // Polling settings for mobile compatibility
    polling: {
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    },
    
    // WebSocket settings
    websocket: {
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      }
    },
    
    // Additional mobile optimizations
    ...(env.isMobile && {
      jsonp: false,
      enablesXDR: false,
      timestampRequests: true
    }),
    
    // Mobile specific fixes (all mobile devices)
    ...(env.isMobile && {
      closeOnBeforeunload: false, // Prevent premature disconnection
      pingInterval: 45000, // Longer ping interval for all mobile devices
      pingTimeout: 120000, // Much longer timeout for all mobile devices
      forceBase64: false, // Disable base64 encoding for better performance
      perMessageDeflate: false // Disable compression for stability
    })
  };
  
  console.log('⚙️ Socket Config:', {
    transports: config.transports,
    timeout: config.timeout,
    upgrade: config.upgrade,
    hasAuth: !!config.auth.token
  });
  
  return config;
};

/**
 * Enhanced socket connection with comprehensive error handling
 */
export const createEnhancedSocket = (serverUrl, token) => {
  if (!token) {
    console.error('❌ No authentication token available');
    throw new Error('Authentication token required for socket connection');
  }
  
  const config = createSocketConfig(serverUrl, token);
  const socket = io(serverUrl, config);
  
  // Enhanced error logging
  socket.on('connect_error', (error) => {
    console.error('🚨 Socket Connection Error:', {
      message: error.message,
      description: error.description,
      context: error.context,
      type: error.type,
      transport: socket.io.engine?.transport?.name,
      readyState: socket.io.engine?.readyState
    });
    
    // Provide user-friendly error messages
    if (error.message.includes('xhr poll error')) {
      console.error('💡 Suggestion: Network connection issue - check internet connectivity');
    } else if (error.message.includes('websocket error')) {
      console.error('💡 Suggestion: WebSocket blocked - will fallback to polling');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Suggestion: Connection timeout - server may be slow or unreachable');
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Suggestion: Token may be expired - try logging in again');
    }
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully:', {
      id: socket.id,
      transport: socket.io.engine.transport.name,
      upgraded: socket.io.engine.upgraded
    });
  });
  
  socket.on('disconnect', (reason, details) => {
    console.log('👋 Socket disconnected:', {
      reason,
      details,
      transport: socket.io.engine?.transport?.name
    });
  });
  
  // Transport change logging
  socket.io.on('upgrade', () => {
    console.log('⬆️ Socket transport upgraded to:', socket.io.engine.transport.name);
  });
  
  socket.io.on('upgradeError', (error) => {
    console.warn('⚠️ Socket transport upgrade failed:', error.message);
  });
  
  return socket;
};

/**
 * Test socket connection with diagnostics
 */
export const testSocketConnection = async (serverUrl, token, timeout = 30000) => {
  console.log('🧪 Testing socket connection...');
  
  return new Promise((resolve, reject) => {
    let socket;
    let timeoutId;
    
    try {
      socket = createEnhancedSocket(serverUrl, token);
      
      timeoutId = setTimeout(() => {
        socket?.disconnect();
        reject(new Error(`Connection test timeout after ${timeout}ms`));
      }, timeout);
      
      socket.on('connect', () => {
        clearTimeout(timeoutId);
        console.log('✅ Socket connection test successful');
        
        // Test basic communication
        socket.emit('ping', { test: true });
        
        setTimeout(() => {
          socket.disconnect();
          resolve({
            success: true,
            socketId: socket.id,
            transport: socket.io.engine.transport.name,
            upgraded: socket.io.engine.upgraded
          });
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeoutId);
        socket?.disconnect();
        reject(new Error(`Connection failed: ${error.message}`));
      });
      
    } catch (error) {
      clearTimeout(timeoutId);
      socket?.disconnect();
      reject(error);
    }
  });
};

export default {
  getAuthToken,
  getClientEnvironment,
  createSocketConfig,
  createEnhancedSocket,
  testSocketConnection
};