import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketManager from '../config/socket.js';
import { setConnecting, setConnectionError } from '../reducers/Slices/socketSlice.js';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { socket, isConnected, connectionStatus } = useSelector(state => state.socket);
  const { currentUser } = useSelector(state => state.user);
  


  useEffect(() => {
    if (currentUser && !socket) {
      dispatch(setConnecting());
      try {
        // Get token from localStorage since that's where your API stores it
        const token = localStorage.getItem('access_token');
        console.log('Current user:', currentUser);
        
        if (token) {
          socketManager.connect(token);
        } else {
          dispatch(setConnectionError('No authentication token found'));
        }
      } catch (error) {
        console.error('Socket connection error:', error);
        dispatch(setConnectionError(error.message));
      }
    }

    return () => {
      // Don't disconnect on unmount, let the app handle it
    };
  }, [currentUser, socket, dispatch]);

  const disconnect = () => {
    socketManager.disconnect();
  };

  const emitUserUpdate = (userData) => {
    socketManager.emitUserUpdate(userData);
  };

  const emitPatientUpdate = (patientData) => {
    socketManager.emitPatientUpdate(patientData);
  };

  const emitOrganizationUpdate = (orgData) => {
    socketManager.emitOrganizationUpdate(orgData);
  };

  const emitUserCreated = (userData) => {
    socketManager.emitUserCreated(userData);
  };

  const emitUserDeleted = (userData) => {
    socketManager.emitUserDeleted(userData);
  };

  // Organization methods
  const emitOrganizationCreated = (orgData) => {
    socketManager.emitOrganizationCreated(orgData);
  };

  const emitOrganizationDeleted = (orgData) => {
    socketManager.emitOrganizationDeleted(orgData);
  };

  const emitOrganizationsUpdate = (orgsData) => {
    socketManager.emitOrganizationsUpdate(orgsData);
  };

  // Patient methods
  const emitPatientCreated = (patientData) => {
    socketManager.emitPatientCreated(patientData);
  };

  const emitPatientDeleted = (patientData) => {
    socketManager.emitPatientDeleted(patientData);
  };

  const emitPatientsUpdate = (patientsData) => {
    socketManager.emitPatientsUpdate(patientsData);
  };

  // Organization member management
  const emitUserAddedToOrganization = (data) => {
    socketManager.emitUserAddedToOrganization(data);
  };

  const emitUserCreatedForOrganization = (data) => {
    socketManager.emitUserCreatedForOrganization(data);
  };

  const emitUserRemovedFromOrganization = (data) => {
    socketManager.emitUserRemovedFromOrganization(data);
  };

  const emitUserRoleUpdated = (data) => {
    socketManager.emitUserRoleUpdated(data);
  };

  // Medical records
  const emitMedicalRecordCreated = (data) => {
    socketManager.emitMedicalRecordCreated(data);
  };

  const emitMedicalRecordUpdated = (data) => {
    socketManager.emitMedicalRecordUpdated(data);
  };

  // Feedback
  const emitFeedbackCreated = (data) => {
    socketManager.emitFeedbackCreated(data);
  };

  const emitFeedbackStatusUpdated = (data) => {
    socketManager.emitFeedbackStatusUpdated(data);
  };

  // Request methods
  const requestOnlineUsers = () => {
    socketManager.requestOnlineUsers();
  };

  const requestOnlineCounts = () => {
    socketManager.requestOnlineCounts();
  };

  const requestOnlineUsersUpdate = () => {
    socketManager.requestOnlineUsersUpdate();
  };

  return {
    socket: socketManager.getSocket(),
    isConnected: socketManager.isConnected(),
    connectionStatus,
    disconnect,
    // User methods
    emitUserUpdate,
    emitUserCreated,
    emitUserDeleted,
    // Patient methods
    emitPatientUpdate,
    emitPatientCreated,
    emitPatientDeleted,
    emitPatientsUpdate,
    // Organization methods
    emitOrganizationUpdate,
    emitOrganizationCreated,
    emitOrganizationDeleted,
    emitOrganizationsUpdate,
    // Organization member management
    emitUserAddedToOrganization,
    emitUserCreatedForOrganization,
    emitUserRemovedFromOrganization,
    emitUserRoleUpdated,
    // Medical records
    emitMedicalRecordCreated,
    emitMedicalRecordUpdated,
    // Feedback
    emitFeedbackCreated,
    emitFeedbackStatusUpdated,
    // Request methods
    requestOnlineUsers,
    requestOnlineCounts,
    requestOnlineUsersUpdate,
  };
};

export default useSocket;