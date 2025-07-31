import React from 'react';
import { useSelector } from 'react-redux';
import socketManager from '../config/socket.js';
import '../css/ConnectionStatus.css';

const ConnectionStatus = ({ showDetails = false }) => {
  const { 
    connectionStatus, 
    isConnected, 
    lastError, 
    connectionHealth,
    isReconnecting 
  } = useSelector(state => state.socket);

  const handleManualReconnect = () => {
    socketManager.manualReconnect();
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'error':
        return '🔴';
      case 'disconnected':
      default:
        return '⚫';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return isReconnecting ? 'Reconnecting...' : 'Connecting...';
      case 'error':
        return 'Connection Error';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  };

  const getHealthColor = () => {
    switch (connectionHealth) {
      case 'good':
        return '#28a745';
      case 'poor':
        return '#ffc107';
      case 'bad':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  if (!showDetails && connectionStatus === 'connected') {
    // Only show when there's an issue if showDetails is false
    return null;
  }

  return (
    <div className={`connection-status ${connectionStatus}`}>
      <div className="status-indicator">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {showDetails && (
        <div className="status-details">
          <div className="connection-health" style={{ color: getHealthColor() }}>
            Health: {connectionHealth}
          </div>
        </div>
      )}
      
      {lastError && (
        <div className="error-message">
          {lastError}
        </div>
      )}
      
      {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
        <button 
          className="retry-button" 
          onClick={handleManualReconnect}
          disabled={isReconnecting}
        >
          {isReconnecting ? 'Reconnecting...' : 'Retry Connection'}
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;