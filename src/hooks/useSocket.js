import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketManager from '../config/socket.js';
import { setConnecting, setConnectionError } from '../reducers/Slices/socketSlice.js';

export const useSocket = () => {
  const dispatch = useDispatch();
  const { 
    socket, 
    connectionStatus, 
    lastError, 
    connectionHealth,
    isReconnecting 
  } = useSelector(state => state.socket);
  const { currentUser } = useSelector(state => state.user);



  useEffect(() => {
    // Only connect if we have a user AND no existing socket connection
    if (currentUser && !socket) {
      console.log('🔄 Initializing socket connection...');
      dispatch(setConnecting());
      
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          socketManager.connect(token);
        } else {
          console.error('❌ No token found for socket connection');
          dispatch(setConnectionError('No authentication token found'));
        }
      } catch (error) {
        console.error('Socket connection error:', error);
        dispatch(setConnectionError(error.message));
      }
    }

    // Cleanup on component unmount
    return () => {
      // Only disconnect if specifically needed, not on every re-render
    };
  }, [currentUser, socket, dispatch]); // Add socket to dependencies


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

  // Organization filtering methods
  const getOrganizationFilteredOnlineUsers = () => {
    return socketManager.getOrganizationFilteredOnlineUsers();
  };

  const getUserOrganizations = () => {
    return socketManager.getUserOrganizations();
  };

  // Organization-specific online user methods
  const getOnlineUsersForOrganization = (organizationId) => {
    return socketManager.getOnlineUsersForOrganization(organizationId);
  };

  const getOnlineCountsByOrganization = () => {
    return socketManager.getOnlineCountsByOrganization();
  };

  const getOnlineCountForOrganization = (organizationId) => {
    return socketManager.getOnlineCountForOrganization(organizationId);
  };

  const getAllOnlineUsersByOrganization = () => {
    return socketManager.getAllOnlineUsersByOrganization();
  };

  // New connection management methods
  const manualReconnect = () => {
    socketManager.manualReconnect();
  };

  const getConnectionStatus = () => {
    return socketManager.getConnectionStatus();
  };

  return {
    socket: socketManager.getSocket(),
    isConnected: socketManager.isConnected(),
    connectionStatus,
    lastError,
    connectionHealth,
    isReconnecting,
    disconnect,
    manualReconnect,
    getConnectionStatus,
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
    // Medical record methods (Requirements 3.1, 5.3)
    emitMedicalRecordCreated,
    emitMedicalRecordUpdated,
    // Feedback methods (Requirements 3.2, 5.3)
    emitFeedbackCreated,
    emitFeedbackStatusUpdated,
    // Request methods for organization-filtered online users (Requirements 3.3, 5.3)
    requestOnlineUsers,
    requestOnlineCounts,
    requestOnlineUsersUpdate,
    // Organization filtering methods
    getOrganizationFilteredOnlineUsers,
    getUserOrganizations,
    // Organization-specific online user methods (Requirements 4.1, 4.2, 4.3, 4.4)
    getOnlineUsersForOrganization,
    getOnlineCountsByOrganization,
    getOnlineCountForOrganization,
    getAllOnlineUsersByOrganization,
  };
};

export default useSocket;