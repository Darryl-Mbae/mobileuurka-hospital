import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketManager from '../config/socket.js';
import { setConnecting, setConnectionError, clearError } from '../reducers/Slices/socketSlice.js';

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

  // Use refs to track connection state and prevent multiple connections
  const connectionInitialized = useRef(false);
  const currentUserId = useRef(null);

  // Memoized connection function to prevent unnecessary re-connections
  const initializeConnection = useCallback(() => {
    if (!currentUser?.id || connectionInitialized.current) {
      console.log('🔄 Skipping connection - no user or already initialized');
      return;
    }

    // Check if socket is already connected and stable
    if (socketManager.isConnected() && socketManager.getConnectionStatus().isConnected) {
      console.log('✅ Socket already connected and stable');
      connectionInitialized.current = true;
      currentUserId.current = currentUser.id;
      return;
    }

    // Only disconnect if user actually changed (different user ID)
    // Don't disconnect for user object updates/refreshes
    if (currentUserId.current && currentUserId.current !== currentUser.id) {
      console.log('🔄 Different user detected, reinitializing connection...');
      console.log(`Previous user: ${currentUserId.current}, New user: ${currentUser.id}`);
      socketManager.disconnect();
      connectionInitialized.current = false;
      currentUserId.current = null;
    }

    console.log('🔄 Initializing socket connection...');
    dispatch(setConnecting());
    
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('🔑 Token found, connecting...');
        socketManager.connect(token);
        connectionInitialized.current = true;
        currentUserId.current = currentUser.id;
      } else {
        console.error('❌ No token found for socket connection');
        dispatch(setConnectionError('No authentication token found'));
      }
    } catch (error) {
      console.error('Socket connection error:', error);
      dispatch(setConnectionError(error.message));
      connectionInitialized.current = false;
    }
  }, [currentUser, dispatch]);

  useEffect(() => {
    // Only initialize if we have a user and haven't initialized yet
    if (currentUser?.id && !connectionInitialized.current) {
      console.log('🔄 Initializing socket for user:', currentUser.id);
      // Small delay to ensure user data is fully loaded
      const timer = setTimeout(() => {
        initializeConnection();
      }, 100);

      return () => clearTimeout(timer);
    }

    // Handle user logout (only disconnect if user is completely gone, not just updating)
    if (!currentUser?.id && connectionInitialized.current) {
      console.log('🔌 User logged out, disconnecting socket...');
      socketManager.disconnect();
      connectionInitialized.current = false;
      currentUserId.current = null;
    }
  }, [currentUser?.id, initializeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only disconnect if the component is truly unmounting (page navigation, etc.)
      // Don't disconnect on re-renders
    };
  }, []);

  // Memoized emit functions to prevent unnecessary re-creations
  const disconnect = useCallback(() => {
    socketManager.disconnect();
    connectionInitialized.current = false;
    currentUserId.current = null;
  }, []);

  const manualReconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested by user');
    connectionInitialized.current = false;
    currentUserId.current = null;
    dispatch(clearError());
    
    // Small delay to ensure clean state reset
    setTimeout(() => {
      initializeConnection();
    }, 500);
  }, [initializeConnection, dispatch]);

  const emitUserUpdate = useCallback((userData) => {
    socketManager.emitUserUpdate(userData);
  }, []);

  const emitPatientUpdate = useCallback((patientData) => {
    socketManager.emitPatientUpdate(patientData);
  }, []);

  const emitOrganizationUpdate = useCallback((orgData) => {
    socketManager.emitOrganizationUpdate(orgData);
  }, []);

  const emitUserCreated = useCallback((userData) => {
    socketManager.emitUserCreated(userData);
  }, []);

  const emitUserDeleted = useCallback((userData) => {
    socketManager.emitUserDeleted(userData);
  }, []);

  const emitOrganizationCreated = useCallback((orgData) => {
    socketManager.emitOrganizationCreated(orgData);
  }, []);

  const emitOrganizationDeleted = useCallback((orgData) => {
    socketManager.emitOrganizationDeleted(orgData);
  }, []);

  const emitOrganizationsUpdate = useCallback((orgsData) => {
    socketManager.emitOrganizationsUpdate(orgsData);
  }, []);

  const emitPatientCreated = useCallback((patientData) => {
    socketManager.emitPatientCreated(patientData);
  }, []);

  const emitPatientDeleted = useCallback((patientData) => {
    socketManager.emitPatientDeleted(patientData);
  }, []);

  const emitPatientsUpdate = useCallback((patientsData) => {
    socketManager.emitPatientsUpdate(patientsData);
  }, []);

  const emitUserAddedToOrganization = useCallback((data) => {
    socketManager.emitUserAddedToOrganization(data);
  }, []);

  const emitUserCreatedForOrganization = useCallback((data) => {
    socketManager.emitUserCreatedForOrganization(data);
  }, []);

  const emitUserRemovedFromOrganization = useCallback((data) => {
    socketManager.emitUserRemovedFromOrganization(data);
  }, []);

  const emitUserRoleUpdated = useCallback((data) => {
    socketManager.emitUserRoleUpdated(data);
  }, []);

  const emitMedicalRecordCreated = useCallback((data) => {
    socketManager.emitMedicalRecordCreated(data);
  }, []);

  const emitMedicalRecordUpdated = useCallback((data) => {
    socketManager.emitMedicalRecordUpdated(data);
  }, []);

  const emitFeedbackCreated = useCallback((data) => {
    socketManager.emitFeedbackCreated(data);
  }, []);

  const emitFeedbackStatusUpdated = useCallback((data) => {
    socketManager.emitFeedbackStatusUpdated(data);
  }, []);

  const requestOnlineUsers = useCallback(() => {
    socketManager.requestOnlineUsers();
  }, []);

  const requestOnlineCounts = useCallback(() => {
    socketManager.requestOnlineCounts();
  }, []);

  const requestOnlineUsersUpdate = useCallback(() => {
    socketManager.requestOnlineUsersUpdate();
  }, []);

  const getOrganizationFilteredOnlineUsers = useCallback(() => {
    return socketManager.getOrganizationFilteredOnlineUsers();
  }, []);

  const getUserOrganizations = useCallback(() => {
    return socketManager.getUserOrganizations();
  }, []);

  const getOnlineUsersForOrganization = useCallback((organizationId) => {
    return socketManager.getOnlineUsersForOrganization(organizationId);
  }, []);

  const getOnlineCountsByOrganization = useCallback(() => {
    return socketManager.getOnlineCountsByOrganization();
  }, []);

  const getOnlineCountForOrganization = useCallback((organizationId) => {
    return socketManager.getOnlineCountForOrganization(organizationId);
  }, []);

  const getAllOnlineUsersByOrganization = useCallback(() => {
    return socketManager.getAllOnlineUsersByOrganization();
  }, []);

  const getConnectionStatus = useCallback(() => {
    return socketManager.getConnectionStatus();
  }, []);

  // Return stable object with memoized functions
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
    // Medical record methods
    emitMedicalRecordCreated,
    emitMedicalRecordUpdated,
    // Feedback methods
    emitFeedbackCreated,
    emitFeedbackStatusUpdated,
    // Request methods
    requestOnlineUsers,
    requestOnlineCounts,
    requestOnlineUsersUpdate,
    // Organization filtering methods
    getOrganizationFilteredOnlineUsers,
    getUserOrganizations,
    // Organization-specific online user methods
    getOnlineUsersForOrganization,
    getOnlineCountsByOrganization,
    getOnlineCountForOrganization,
    getAllOnlineUsersByOrganization,
  };
};

export default useSocket;