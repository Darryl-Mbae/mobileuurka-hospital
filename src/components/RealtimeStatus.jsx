import React from 'react';
import { useSelector } from 'react-redux';

const RealtimeStatus = ({ showDetails = false }) => {
  const isConnected = useSelector(state => state.socket.isConnected);
  const onlineUsers = useSelector(state => state.user.onlineUsersDetailed);

  if (!showDetails) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '12px',
        color: isConnected ? '#4CAF50' : '#f44336'
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#4CAF50' : '#f44336'
        }} />
        {isConnected ? 'Live' : 'Offline'}
      </div>
    );
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: isConnected ? '#e8f5e8' : '#ffeaea',
      border: `1px solid ${isConnected ? '#4CAF50' : '#f44336'}`,
      borderRadius: '4px',
      fontSize: '14px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
        Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      {isConnected && onlineUsers.length > 0 && (
        <div>
          Online Users: {onlineUsers.length}
        </div>
      )}
    </div>
  );
};

export default RealtimeStatus;