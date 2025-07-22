import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const RealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const socket = useSelector(state => state.socket.socket);
  const isConnected = useSelector(state => state.socket.isConnected);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for various realtime events and show notifications
    const handlePatientAdded = (patient) => {
      addNotification(`New patient added: ${patient.name}`, 'success');
    };

    const handlePatientUpdated = (patient) => {
      addNotification(`Patient updated: ${patient.name}`, 'info');
    };

    const handlePatientDeleted = (data) => {
      const patientName = data.name || 'Unknown Patient';
      addNotification(`Patient deleted: ${patientName}`, 'warning');
    };

    const handleUserOnline = (data) => {
      addNotification(`${data.userName || 'User'} came online`, 'info');
    };

    const handleUserOffline = (data) => {
      addNotification(`${data.userName || 'User'} went offline`, 'info');
    };

    // Add event listeners
    socket.on('patient_added', handlePatientAdded);
    socket.on('patient_updated', handlePatientUpdated);
    socket.on('patient_deleted', handlePatientDeleted);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    // Cleanup
    return () => {
      socket.off('patient_added', handlePatientAdded);
      socket.off('patient_updated', handlePatientUpdated);
      socket.off('patient_deleted', handlePatientDeleted);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, isConnected]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type, timestamp: new Date() };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          style={{
            backgroundColor: getNotificationColor(notification.type),
            color: 'white',
            padding: '12px 16px',
            marginBottom: '8px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            animation: 'slideIn 0.3s ease-out'
          }}
          onClick={() => removeNotification(notification.id)}
        >
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
            {notification.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return '#4CAF50';
    case 'warning': return '#FF9800';
    case 'error': return '#f44336';
    case 'info':
    default: return '#2196F3';
  }
};

export default RealtimeNotifications;