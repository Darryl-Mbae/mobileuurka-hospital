/**
 * Socket Reconnection Logic Demonstration
 * 
 * This file demonstrates the enhanced socket reconnection features:
 * 1. Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s max)
 * 2. Maximum retry limit (10 attempts)
 * 3. Connection status tracking
 * 4. Better error messages
 * 5. Manual reconnection capability
 */

import socketManager from '../config/socket.js';

// Example usage of the enhanced socket manager
export const demonstrateReconnectionLogic = () => {
  console.log('=== Socket Reconnection Logic Demo ===');
  
  // 1. Show exponential backoff calculation
  console.log('\n1. Exponential Backoff Delays:');
  for (let attempt = 0; attempt < 6; attempt++) {
    socketManager.reconnectAttempts = attempt;
    const delay = socketManager.calculateReconnectDelay();
    console.log(`  Attempt ${attempt + 1}: ${Math.round(delay / 1000)}s`);
  }
  
  // 2. Show error message mapping
  console.log('\n2. Error Message Mapping:');
  const testErrors = [
    { type: 'timeout' },
    { type: 'transport error' },
    { message: 'custom error' },
    null
  ];
  
  testErrors.forEach(error => {
    const message = socketManager.getErrorMessage(error);
    console.log(`  ${JSON.stringify(error)} -> "${message}"`);
  });
  
  // 3. Show reconnection decision logic
  console.log('\n3. Reconnection Decision Logic:');
  const disconnectReasons = [
    'transport close',
    'ping timeout',
    'io server disconnect',
    'io client disconnect'
  ];
  
  disconnectReasons.forEach(reason => {
    const shouldReconnect = socketManager.shouldReconnect(reason);
    console.log(`  "${reason}" -> ${shouldReconnect ? 'RECONNECT' : 'NO RECONNECT'}`);
  });
  
  // 4. Show connection status
  console.log('\n4. Current Connection Status:');
  const status = socketManager.getConnectionStatus();
  console.log('  Status:', JSON.stringify(status, null, 2));
  
  console.log('\n=== Demo Complete ===');
};

// Example of how to use the ConnectionStatus component
export const connectionStatusExample = `
// In your React component:
import ConnectionStatus from '../components/ConnectionStatus.jsx';

function MyComponent() {
  return (
    <div>
      {/* Show connection status only when there are issues */}
      <ConnectionStatus />
      
      {/* Or show detailed connection status always */}
      <ConnectionStatus showDetails={true} />
      
      {/* Your other content */}
    </div>
  );
}
`;

// Example of using the enhanced useSocket hook
export const useSocketExample = `
// In your React component:
import useSocket from '../hooks/useSocket.js';

function MyComponent() {
  const { 
    isConnected, 
    connectionStatus, 
    lastError, 
    connectionHealth,
    isReconnecting,
    manualReconnect 
  } = useSocket();
  
  const handleReconnect = () => {
    manualReconnect();
  };
  
  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Health: {connectionHealth}</div>
      {lastError && <div>Error: {lastError}</div>}
      {!isConnected && (
        <button onClick={handleReconnect} disabled={isReconnecting}>
          {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
        </button>
      )}
    </div>
  );
}
`;

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateReconnectionLogic();
}