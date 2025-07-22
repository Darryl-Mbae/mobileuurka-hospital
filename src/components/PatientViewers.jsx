import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const PatientViewers = ({ patientId }) => {
  const [viewers, setViewers] = useState([]);
  const socket = useSelector(state => state.socket.socket);
  const isConnected = useSelector(state => state.socket.isConnected);
  const currentUser = useSelector(state => state.user.currentUser);

  useEffect(() => {
    if (!socket || !isConnected || !patientId) return;

    const handlePatientViewers = (data) => {
      if (data.patientId === patientId) {
        // Filter out current user from viewers list
        const otherViewers = data.viewers.filter(viewer => viewer.userId !== currentUser?.id);
        setViewers(otherViewers);
      }
    };

    socket.on('patient_viewers_updated', handlePatientViewers);

    return () => {
      socket.off('patient_viewers_updated', handlePatientViewers);
    };
  }, [socket, isConnected, patientId, currentUser]);

  if (viewers.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      backgroundColor: '#f0f8ff',
      border: '1px solid #e0e8f0',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#666'
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: '#4CAF50'
      }} />
      <span>
        {viewers.length === 1 
          ? `${viewers[0].userName} is viewing this patient`
          : `${viewers.length} users are viewing this patient`
        }
      </span>
    </div>
  );
};

export default PatientViewers;