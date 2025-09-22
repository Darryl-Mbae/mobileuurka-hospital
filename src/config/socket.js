import io from "socket.io-client";
import { store } from "./store.js";
import {
  setSocket,
  setConnecting,
  disconnectSocket,
  resetSocket,
  setConnectionError,
  clearError,
  setReconnectAttempts,
  setConnectionHealth,
  setReconnecting,
} from "../reducers/Slices/socketSlice.js";
import {
  setOnlineUsers,
  setOnlineUsersByOrganization,
  setAllOnlineUsersByOrganization,
  addOnlineUserToOrganization,
  removeOnlineUserFromOrganization,
  setOnlineCountsByOrganization,
  updateOnlineCountForOrganization,
  userWentOffline,
  updateUser,
  setUsers,
  addUser,
  deleteUser,
} from "../reducers/Slices/userSlice.js";
import {
  updatePatient,
  setPatients,
  addPatient,
  deletePatient,
  updatePatientMedicalRecord,
} from "../reducers/Slices/patientsSlice.js";
import {
  updateOrganisation,
  setOrganisations,
  addOrganisation,
  removeOrganisation,
} from "../reducers/Slices/organizationSlice.js";
import { addChat } from "../reducers/Slices/chatSlice.js";

const SERVER = import.meta.env.VITE_SOCKET_URL;

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.reconnectTimer = null;
    this.isReconnecting = false;
  }

  // Helper function to get current user's organization memberships
  getCurrentUserOrganizations() {
    const state = store.getState();
    const currentUser = state.user.currentUser;
    const organizations = state.organisation.organisations;
    
    if (!currentUser) return [];
    
    // Get organizations where the current user is a member
    // This assumes organizations have a members array or similar structure
    const userOrganizations = organizations.filter(org => {
      // Check if user is a member of this organization
      // This could be through org.members, org.users, or org.memberIds depending on your data structure
      if (org.members && Array.isArray(org.members)) {
        return org.members.some(member => 
          (typeof member === 'object' ? member.id : member) === currentUser.id
        );
      }
      if (org.users && Array.isArray(org.users)) {
        return org.users.some(user => 
          (typeof user === 'object' ? user.id : user) === currentUser.id
        );
      }
      if (org.memberIds && Array.isArray(org.memberIds)) {
        return org.memberIds.includes(currentUser.id);
      }
      // Fallback: check if user's organizationId matches (for single organization membership)
      if (currentUser.organizationId) {
        return org.id === currentUser.organizationId;
      }
      return false;
    });
    
    return userOrganizations.map(org => org.id);
  }

  // Helper function to check if user should see an event based on organization filtering
  shouldProcessEvent(eventData) {
    const userOrganizations = this.getCurrentUserOrganizations();
    
    // If user has no organizations, they can see all events (fallback for admin users)
    if (userOrganizations.length === 0) {
      return true;
    }
    
    // If event has organization context, check if user belongs to that organization
    if (eventData.organizationId) {
      return userOrganizations.includes(eventData.organizationId);
    }
    
    // If event has organization array, check if user belongs to any of those organizations
    if (eventData.organizationIds && Array.isArray(eventData.organizationIds)) {
      return eventData.organizationIds.some(orgId => userOrganizations.includes(orgId));
    }
    
    // For user-related events, check if the user belongs to shared organizations
    if (eventData.user && eventData.user.organizationId) {
      return userOrganizations.includes(eventData.user.organizationId);
    }
    
    // For patient-related events, check patient's organization
    if (eventData.patient && eventData.patient.organizationId) {
      return userOrganizations.includes(eventData.patient.organizationId);
    }
    
    // For events without clear organization context, allow them (they might be system-wide)
    return true;
  }

  // Helper function to filter online users by shared organizations
  filterOnlineUsersByOrganization(onlineUsers) {
    const userOrganizations = this.getCurrentUserOrganizations();
    const state = store.getState();
    const allUsers = state.user.users;
    
    if (userOrganizations.length === 0) {
      return onlineUsers; // No filtering if user has no organizations
    }
    
    // Filter online users to only include those from shared organizations
    return onlineUsers.filter(onlineUserId => {
      const user = allUsers.find(u => u.id === onlineUserId);
      if (!user) return false;
      
      // Check if this user belongs to any of the current user's organizations
      if (user.organizationId) {
        return userOrganizations.includes(user.organizationId);
      }
      
      // Check by organization name (for Users.jsx structure)
      if (user.org) {
        const currentUser = state.user.currentUser;
        const currentUserOrg = allUsers.find(u => u.id === currentUser?.id)?.org;
        return user.org === currentUserOrg;
      }
      
      // If user has multiple organizations, check for overlap
      if (user.organizationIds && Array.isArray(user.organizationIds)) {
        return user.organizationIds.some(orgId => userOrganizations.includes(orgId));
      }
      
      return true; // Show all users if no organization filtering can be applied
    });
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return this.socket;
    }

    // Clear any existing reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Set connecting status
    store.dispatch(setConnecting());
    console.log("🔄 Connecting to socket server...");

    this.socket = io(SERVER, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 25000,
      forceNew: true,
    });

    this.setupEventListeners();

    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully to server");
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      
      // Clear any existing reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      store.dispatch(setSocket(this.socket));
      store.dispatch(clearError());
      
      // Request initial online users and counts when connected
      this.requestOnlineUsers();
      this.requestOnlineCounts();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("👋 Socket disconnected from server:", reason);
      store.dispatch(resetSocket());
      
      // Only attempt reconnection for certain disconnect reasons
      if (this.shouldReconnect(reason)) {
        this.handleReconnect(reason);
      }
    });

    this.socket.on("connect_error", (error) => {
      const errorMessage = this.getErrorMessage(error);
      console.error("❌ Socket connection error:", errorMessage);
      console.error("Error details:", error.message, error.description, error.context);
      
      store.dispatch(setConnectionError(errorMessage));
      this.handleReconnect("connect_error");
    });

    // Online users events with organization filtering
    this.socket.on("online_users_updated", (data) => {
      // Handle both old format (array) and new format (object with users property)
      let usersArray;
      if (Array.isArray(data)) {
        // Old format: direct array of users
        usersArray = data;
      } else if (data && Array.isArray(data.users)) {
        // New format: object with users property
        usersArray = data.users;
      } else {
        console.warn("online_users_updated received invalid data format:", data);
        store.dispatch(setOnlineUsers([]));
        store.dispatch(setAllOnlineUsersByOrganization({}));
        return;
      }
      
      const userIds = usersArray.map((user) => user.userId || user.id || user);
      console.log('Raw online user IDs from server:', userIds);
      const filteredUserIds = this.filterOnlineUsersByOrganization(userIds);
      console.log('Filtered online user IDs:', filteredUserIds);
      
      // Update backward compatibility array
      store.dispatch(setOnlineUsers(filteredUserIds));
      
      // Update organization-specific online users
      this.updateOnlineUsersByOrganization(filteredUserIds);
    });

    this.socket.on("user_online", (data) => {
      // Check if this user should be visible based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out user_online event for user not in shared organizations:", data.userId);
        return;
      }
      
      const currentOnlineUsers = store.getState().user.onlineUsers;
      if (!currentOnlineUsers.includes(data.userId)) {
        // Update backward compatibility array
        store.dispatch(setOnlineUsers([...currentOnlineUsers, data.userId]));
        
        // Update organization-specific online users
        this.addUserToOrganizationOnlineList(data.userId);
      }
    });

    this.socket.on("user_offline", (data) => {
      // Always process user_offline events to keep online list accurate
      // The userWentOffline action now handles both backward compatibility and organization-specific removal
      store.dispatch(userWentOffline(data));
    });

    // User events with organization filtering
    this.socket.on("user_updated", (userData) => {
      console.log("Received user_updated:", userData);
      // Check if this user update should be processed based on organization filtering
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log("Filtered out user_updated event for user not in shared organizations:", userData.id);
        return;
      }
      store.dispatch(updateUser(userData));
    });

    this.socket.on("users_updated", (usersData) => {
      console.log("Received users_updated:", usersData);
      // Filter users list to only include users from shared organizations
      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredUsers = usersData;
      
      if (userOrganizations.length > 0) {
        filteredUsers = usersData.filter(user => {
          if (user.organizationId) {
            return userOrganizations.includes(user.organizationId);
          }
          if (user.organizationIds && Array.isArray(user.organizationIds)) {
            return user.organizationIds.some(orgId => userOrganizations.includes(orgId));
          }
          return false;
        });
      }
      
      store.dispatch(setUsers(filteredUsers));
    });

    this.socket.on("user_created", (userData) => {
      console.log("Received user_created:", userData);
      // Check if this user creation should be processed based on organization filtering
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log("Filtered out user_created event for user not in shared organizations:", userData.id);
        return;
      }
      store.dispatch(addUser(userData));
    });

    this.socket.on("user_deleted", (userData) => {
      console.log("Received user_deleted:", userData);
      // Check if this user deletion should be processed based on organization filtering
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log("Filtered out user_deleted event for user not in shared organizations:", userData.id);
        return;
      }
      store.dispatch(deleteUser(userData));
    });

    // Organization member management events with organization filtering
    this.socket.on("user_added_to_organization", (data) => {
      console.log("Received user_added_to_organization:", data);
      
      // Check if this event should be processed based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out user_added_to_organization event for organization not accessible:", data.organizationId);
        return;
      }
      
      // Add or update user in the users list
      if (data.user) {
        // Check if user exists, if not add them, otherwise update
        const currentUsers = store.getState().user.users;
        const existingUser = currentUsers.find((u) => u.id === data.user.id);
        if (existingUser) {
          store.dispatch(updateUser(data.user));
        } else {
          store.dispatch(addUser(data.user));
        }
      }
      // Update organization data if provided
      if (data.organization) {
        store.dispatch(updateOrganisation(data.organization));
      }
    });

    this.socket.on("user_created_for_organization", (data) => {
      console.log("Received user_created_for_organization:", data);
      
      // Check if this event should be processed based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out user_created_for_organization event for organization not accessible:", data.organizationId);
        return;
      }
      
      if (data.user) {
        store.dispatch(addUser(data.user));
      }
    });

    this.socket.on("user_removed_from_organization", (data) => {
      console.log("Received user_removed_from_organization:", data);
      
      // Check if this event should be processed based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out user_removed_from_organization event for organization not accessible:", data.organizationId);
        return;
      }
      
      if (data.userId) {
        store.dispatch(deleteUser({ id: data.userId }));
      }
    });

    this.socket.on("user_role_updated", (data) => {
      console.log("Received user_role_updated:", data);
      
      // Check if this event should be processed based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out user_role_updated event for organization not accessible:", data.organizationId);
        return;
      }
      
      if (data.user) {
        store.dispatch(updateUser(data.user));
      }
      // Update organization data if provided
      if (data.organization) {
        store.dispatch(updateOrganisation(data.organization));
      }
    });
    // Patient events with organization filtering
    this.socket.on("patient_created", (eventData) => {
      console.log("Received patient_created:", eventData);
      
      // Extract patient data from the event - it might be nested in a 'patient' property
      const patientData = eventData.patient || eventData;
      
      // Create organization filtering context using both event-level and patient-level organizationId
      const filteringContext = {
        organizationId: eventData.organizationId || patientData.organizationId,
        patient: patientData
      };
      
      // Check if this patient should be visible based on organization filtering
      if (!this.shouldProcessEvent(filteringContext)) {
        console.log("Filtered out patient_created event for patient not in accessible organizations:", patientData.id);
        return;
      }
      
      console.log("Adding patient to Redux store:", patientData.id);
      store.dispatch(addPatient(patientData));
    });

    this.socket.on("patient_updated", (eventData) => {
      console.log("Received patient_updated:", eventData);
      
      // Extract patient data from the event - it might be nested in a 'patient' property
      const patientData = eventData.patient || eventData;
      
      // Create organization filtering context using both event-level and patient-level organizationId
      const filteringContext = {
        organizationId: eventData.organizationId || patientData.organizationId,
        patient: patientData
      };
      
      // Check if this patient should be visible based on organization filtering
      if (!this.shouldProcessEvent(filteringContext)) {
        console.log("Filtered out patient_updated event for patient not in accessible organizations:", patientData.id);
        return;
      }
      
      console.log("Updating patient in Redux store:", patientData.id);
      store.dispatch(updatePatient(patientData));
    });

    this.socket.on("patient_deleted", (data) => {
      console.log("Received patient_deleted:", data);
      
      // For patient deletion, we need to check if the patient was accessible
      // Since we might not have full patient data, we'll allow the deletion to proceed
      // The backend should only send deletions for patients the user had access to
      const patientId = data.id || data.patientId || data;
      store.dispatch(deletePatient(patientId));
    });

    this.socket.on("patients_updated", (eventData) => {
      console.log("Received patients_updated:", eventData);
      
      // Extract patients array from the event data
      const patientsData = eventData.patients || eventData;
      
      // Ensure we have an array to work with
      if (!Array.isArray(patientsData)) {
        console.warn("patients_updated received invalid data format:", eventData);
        return;
      }
      
      // Filter patients list to only include patients from accessible organizations
      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredPatients = patientsData;
      
      if (userOrganizations.length > 0) {
        filteredPatients = patientsData.filter(patient => {
          if (patient.organizationId) {
            return userOrganizations.includes(patient.organizationId);
          }
          // If patient doesn't have organization info, allow it (might be system-wide)
          return true;
        });
      }
      
      store.dispatch(setPatients(filteredPatients));
    });

    // Organization events with filtering
    this.socket.on("organization_created", (orgData) => {
      console.log("Received organization_created:", orgData);
      
      // Check if this organization should be visible to the current user
      if (!this.shouldProcessEvent({ organizationId: orgData.id })) {
        console.log("Filtered out organization_created event for organization not accessible:", orgData.id);
        return;
      }
      
      store.dispatch(addOrganisation(orgData));
    });

    this.socket.on("organization_updated", (orgData) => {
      console.log("Received organization_updated:", orgData);
      
      // Check if this organization should be visible to the current user
      if (!this.shouldProcessEvent({ organizationId: orgData.id })) {
        console.log("Filtered out organization_updated event for organization not accessible:", orgData.id);
        return;
      }
      
      store.dispatch(updateOrganisation(orgData));
    });

    this.socket.on("organization_deleted", (data) => {
      console.log("Received organization_deleted:", data);
      const orgId = data.id || data.organizationId || data;
      
      // Check if this organization deletion should be processed
      if (!this.shouldProcessEvent({ organizationId: orgId })) {
        console.log("Filtered out organization_deleted event for organization not accessible:", orgId);
        return;
      }
      
      store.dispatch(removeOrganisation(orgId));
    });

    this.socket.on("organizations_updated", (orgsData) => {
      console.log("Received organizations_updated:", orgsData);
      
      // Filter organizations list to only include organizations the user has access to
      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredOrganizations = orgsData;
      
      if (userOrganizations.length > 0) {
        filteredOrganizations = orgsData.filter(org => userOrganizations.includes(org.id));
      }
      
      store.dispatch(setOrganisations(filteredOrganizations));
    });

    // Enhanced online users events with organization filtering
    this.socket.on("online_count_updated", (data) => {
      // console.log("Received online_count_updated:", data);
      
      // Check if this online count update should be processed based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out online_count_updated event for organization not accessible:", data.organizationId);
        return;
      }
      
      // Store organization-specific online counts in user slice
      if (data.organizationId && data.count !== undefined) {
        store.dispatch(updateOnlineCountForOrganization({
          organizationId: data.organizationId,
          count: data.count
        }));
        // console.log(
        //   `Organization ${data.organizationId} has ${data.count} users online`
        // );
      }
    });

    // Medical record events with organization filtering
    this.socket.on("medical_record_created", (data) => {
      console.log("Received medical_record_created:", data);
      
      // Check if this medical record should be visible based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out medical_record_created event for record not in accessible organizations:", data.patientId);
        return;
      }
      
      // Enhanced medical record created handling
      this.handleMedicalRecordEvent(data, 'created');
    });

    this.socket.on("medical_record_updated", (data) => {
      console.log("Received medical_record_updated:", data);
      
      // Check if this medical record should be visible based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out medical_record_updated event for record not in accessible organizations:", data.patientId);
        return;
      }
      
      // Enhanced medical record updated handling
      this.handleMedicalRecordEvent(data, 'updated');
    });

    // Feedback events with organization filtering
    this.socket.on("feedback_created", (data) => {
      console.log("Received feedback_created:", data);
      
      // Check if this feedback should be visible based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out feedback_created event for feedback not in accessible organizations:", data.organizationId);
        return;
      }
      
      // If feedback includes chat data, add it to chat slice
      if (data.chat) {
        store.dispatch(addChat(data.chat));
      }
      // If feedback is related to a patient, update patient data
      if (data.patient) {
        store.dispatch(updatePatient(data.patient));
      }
    });

    this.socket.on("feedback_status_updated", (data) => {
      console.log("Received feedback_status_updated:", data);
      
      // Check if this feedback should be visible based on organization filtering
      if (!this.shouldProcessEvent(data)) {
        console.log("Filtered out feedback_status_updated event for feedback not in accessible organizations:", data.organizationId);
        return;
      }
      
      // If feedback includes chat data, add it to chat slice
      if (data.chat) {
        store.dispatch(addChat(data.chat));
      }
      // If feedback is related to a patient, update patient data
      if (data.patient) {
        store.dispatch(updatePatient(data.patient));
      }
    });

    // Response handlers for request-response events with organization filtering
    this.socket.on("get_online_users_response", (data) => {
      if (data.success && data.users && Array.isArray(data.users)) {
        // Extract user IDs from the response and filter by organization
        const userIds = data.users.map((user) => user.userId || user.id);
        const filteredUserIds = this.filterOnlineUsersByOrganization(userIds);
        
        // Update backward compatibility array
        store.dispatch(setOnlineUsers(filteredUserIds));
        
        // Update organization-specific online users
        this.updateOnlineUsersByOrganization(filteredUserIds);
      } else if (data.error) {
        console.error("Error getting online users:", data.error);
      }
    });

    this.socket.on("get_online_counts_response", (data) => {
      if (data.success && data.counts) {
        // Filter organization counts to only show counts for accessible organizations
        const userOrganizations = this.getCurrentUserOrganizations();
        let filteredCounts = data.counts;
        
        if (userOrganizations.length > 0 && typeof data.counts === 'object') {
          filteredCounts = {};
          userOrganizations.forEach(orgId => {
            if (data.counts[orgId] !== undefined) {
              filteredCounts[orgId] = data.counts[orgId];
            }
          });
        }
        
        // Store organization-specific online counts
        store.dispatch(setOnlineCountsByOrganization(filteredCounts));
      } else if (data.error) {
        console.error("Error getting online counts:", data.error);
      }
    });

    // Keep alive
    this.socket.on("pong", () => {
      // Handle pong response if needed
    });

    // Send ping every 30 seconds to keep connection alive
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");
      }
    }, 30000);
  }

  shouldReconnect(reason) {
    // Don't reconnect for certain reasons
    const noReconnectReasons = [
      'io server disconnect', // Server intentionally disconnected us
      'io client disconnect', // We intentionally disconnected
    ];
    
    return !noReconnectReasons.includes(reason);
  }

  getErrorMessage(error) {
    if (!error) return "Unknown connection error";
    
    // Map common error types to user-friendly messages
    const errorMap = {
      'timeout': 'Connection timeout - server may be unavailable',
      'transport error': 'Network connection failed',
      'xhr poll error': 'Network connection interrupted',
      'websocket error': 'WebSocket connection failed',
      'parse error': 'Invalid server response',
      'transport close': 'Connection was closed unexpectedly',
    };
    
    const errorType = error.type || error.message || 'unknown';
    return errorMap[errorType] || `Connection failed: ${errorType}`;
  }

  calculateReconnectDelay() {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    
    // Add some jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  handleReconnect(reason = "unknown") {
    // Prevent multiple concurrent reconnection attempts
    if (this.isReconnecting) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      const finalError = `Failed to reconnect after ${this.maxReconnectAttempts} attempts. ${reason ? `Last reason: ${reason}` : ''}`;
      store.dispatch(setConnectionError(finalError));
      store.dispatch(setConnectionHealth('bad'));
      store.dispatch(setReconnecting(false));
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;
    
    // Update Redux state
    store.dispatch(setReconnectAttempts(this.reconnectAttempts));
    store.dispatch(setReconnecting(true));
    
    // Set connection health based on attempts
    if (this.reconnectAttempts <= 2) {
      store.dispatch(setConnectionHealth('poor'));
    } else if (this.reconnectAttempts <= 5) {
      store.dispatch(setConnectionHealth('bad'));
    }
    
    const delay = this.calculateReconnectDelay();
    const delaySeconds = Math.round(delay / 1000);
    
    console.log(
      `🔄 Attempting to reconnect in ${delaySeconds}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );
    
    // Update Redux state with reconnection info
    const reconnectMessage = `Reconnecting in ${delaySeconds}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
    store.dispatch(setConnectionError(reconnectMessage));

    this.reconnectTimer = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}...`);
        store.dispatch(setConnecting());
        this.isReconnecting = false;
        this.socket.connect();
      } else {
        this.isReconnecting = false;
        store.dispatch(setReconnecting(false));
      }
    }, delay);
  }

  disconnect() {
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.disconnect();
      store.dispatch(disconnectSocket());
      this.socket = null;
    }
  }

  // Manual reconnection method for user-triggered reconnects
  manualReconnect() {
    console.log("🔄 Manual reconnection requested");
    
    // Reset reconnection state
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    
    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Clear error state
    store.dispatch(clearError());
    
    // Disconnect and reconnect
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Get token from store and reconnect
    const state = store.getState();
    const token = state.user?.token || state.auth?.token;
    
    console.log(token)
    if (token) {
      this.connect(token);
    } else {
      console.error("❌ No token available for manual reconnection");
      store.dispatch(setConnectionError("Authentication token not available"));
    }
  }

  // Get connection status for UI components
  getConnectionStatus() {
    const state = store.getState();
    return {
      status: state.socket.connectionStatus,
      isConnected: state.socket.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastError: state.socket.lastError,
      isReconnecting: this.isReconnecting,
    };
  }

  // Helper method to handle medical record events
  handleMedicalRecordEvent(eventData, eventType) {
    console.log(`Processing medical record ${eventType} event:`, eventData);
    
    // Extract patient data from the event - it might be nested in a 'patient' property
    const patientData = eventData.patient;
    
    // Primary approach: Update patient data if provided
    if (patientData) {
      console.log(`Updating patient data for medical record ${eventType}:`, patientData.id);
      store.dispatch(updatePatient(patientData));
      return;
    }
    
    // Secondary approach: If only patientId is provided, update the specific patient
    if (eventData.patientId) {
      const state = store.getState();
      const currentPatient = state.patient?.patients?.find(p => p.id === eventData.patientId);
      
      if (currentPatient) {
        console.log(`Found patient ${eventData.patientId} in state, updating with medical record ${eventType}`);
        
        // Check for medical record data in different possible properties
        const medicalRecordData = eventData.medicalRecord || eventData.record;
        const recordType = eventData.recordType || eventData.modelName || medicalRecordData?.type;
        
        if (medicalRecordData && recordType) {
          // Map the record type to the correct patient array property
          let mappedRecordType = recordType;
          switch (recordType) {
            case 'patienthistory':
              mappedRecordType = 'patientHistories';
              break;
            case 'triage':
              mappedRecordType = 'triage';
              break;
            case 'labwork':
              mappedRecordType = 'labwork';
              break;
            case 'pregnancy':
            case 'currentPregnancy':
              mappedRecordType = 'pregnancy';
              break;
            case 'infection':
              mappedRecordType = 'infection';
              break;
            case 'fetal':
            case 'fetalInfo':
              mappedRecordType = 'fetal';
              break;
          }
          
          // Use the specialized medical record update action
          store.dispatch(updatePatientMedicalRecord({
            patientId: eventData.patientId,
            recordType: mappedRecordType,
            recordData: medicalRecordData,
            eventType: eventType
          }));
          
          console.log(`Patient ${eventData.patientId} updated with ${recordType} medical record ${eventType}`);
        } else {
          // If no specific medical record data, just update the patient's timestamp
          const updatedPatient = { ...currentPatient, lastUpdated: new Date().toISOString() };
          store.dispatch(updatePatient(updatedPatient));
          console.log(`Patient ${eventData.patientId} timestamp updated for medical record ${eventType}`);
        }
      } else {
        console.log(`Patient ${eventData.patientId} not found in current state - medical record ${eventType} event received but cannot update UI`);
      }
    }
    
    // Log the event for debugging
    console.log(`Medical record ${eventType} processed:`, {
      patientId: eventData.patientId,
      recordType: eventData.recordType || eventData.modelName,
      hasPatientData: !!eventData.patient,
      hasMedicalRecordData: !!(eventData.medicalRecord || eventData.record),
      recordDataKeys: eventData.record ? Object.keys(eventData.record) : []
    });
  }

  // Helper method to update organization-specific online users
  updateOnlineUsersByOrganization(filteredUserIds) {
    const state = store.getState();
    const allUsers = state.user.users;
    const userOrganizations = this.getCurrentUserOrganizations();
    
    // Create organization-specific online user mapping
    const onlineUsersByOrg = {};
    
    userOrganizations.forEach(orgId => {
      onlineUsersByOrg[orgId] = [];
    });
    
    // Categorize online users by their organizations
    filteredUserIds.forEach(userId => {
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        // Add user to their organization's online list
        if (user.organizationId && userOrganizations.includes(user.organizationId)) {
          if (!onlineUsersByOrg[user.organizationId]) {
            onlineUsersByOrg[user.organizationId] = [];
          }
          onlineUsersByOrg[user.organizationId].push(userId);
        }
        
        // Handle users with multiple organizations
        if (user.organizationIds && Array.isArray(user.organizationIds)) {
          user.organizationIds.forEach(orgId => {
            if (userOrganizations.includes(orgId)) {
              if (!onlineUsersByOrg[orgId]) {
                onlineUsersByOrg[orgId] = [];
              }
              if (!onlineUsersByOrg[orgId].includes(userId)) {
                onlineUsersByOrg[orgId].push(userId);
              }
            }
          });
        }
      }
    });
    
    store.dispatch(setAllOnlineUsersByOrganization(onlineUsersByOrg));
  }

  // Helper method to add a user to organization-specific online lists
  addUserToOrganizationOnlineList(userId) {
    const state = store.getState();
    const allUsers = state.user.users;
    const userOrganizations = this.getCurrentUserOrganizations();
    
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      // Add user to their organization's online list
      if (user.organizationId && userOrganizations.includes(user.organizationId)) {
        store.dispatch(addOnlineUserToOrganization({
          organizationId: user.organizationId,
          userId: userId
        }));
      }
      
      // Handle users with multiple organizations
      if (user.organizationIds && Array.isArray(user.organizationIds)) {
        user.organizationIds.forEach(orgId => {
          if (userOrganizations.includes(orgId)) {
            store.dispatch(addOnlineUserToOrganization({
              organizationId: orgId,
              userId: userId
            }));
          }
        });
      }
    }
  }

  // Helper methods to emit events
  emitUserUpdate(userData) {
    if (this.socket?.connected) {
      this.socket.emit("user_updated", userData);
    }
  }

  emitPatientUpdate(patientData) {
    if (this.socket?.connected) {
      this.socket.emit("patient_updated", patientData);
    }
  }

  emitOrganizationUpdate(orgData) {
    if (this.socket?.connected) {
      this.socket.emit("organization_updated", orgData);
    }
  }

  emitUserCreated(userData) {
    if (this.socket?.connected) {
      this.socket.emit("user_created", userData);
    }
  }

  emitUserDeleted(userData) {
    if (this.socket?.connected) {
      this.socket.emit("user_deleted", userData);
    }
  }

  // Organization events
  emitOrganizationCreated(orgData) {
    if (this.socket?.connected) {
      this.socket.emit("organization_created", orgData);
    }
  }

  emitOrganizationDeleted(orgData) {
    if (this.socket?.connected) {
      this.socket.emit("organization_deleted", orgData);
    }
  }

  emitOrganizationsUpdate(orgsData) {
    if (this.socket?.connected) {
      this.socket.emit("organizations_updated", orgsData);
    }
  }

  // Patient events
  emitPatientCreated(patientData) {
    if (this.socket?.connected) {
      this.socket.emit("patient_created", patientData);
    }
  }

  emitPatientDeleted(patientData) {
    if (this.socket?.connected) {
      this.socket.emit("patient_deleted", patientData);
    }
  }

  emitPatientsUpdate(patientsData) {
    if (this.socket?.connected) {
      this.socket.emit("patients_updated", patientsData);
    }
  }

  // Organization member management
  emitUserAddedToOrganization(data) {
    if (this.socket?.connected) {
      this.socket.emit("user_added_to_organization", data);
    }
  }

  emitUserCreatedForOrganization(data) {
    if (this.socket?.connected) {
      this.socket.emit("user_created_for_organization", data);
    }
  }

  emitUserRemovedFromOrganization(data) {
    if (this.socket?.connected) {
      this.socket.emit("user_removed_from_organization", data);
    }
  }

  emitUserRoleUpdated(data) {
    if (this.socket?.connected) {
      this.socket.emit("user_role_updated", data);
    }
  }

  // Medical records
  emitMedicalRecordCreated(data) {
    if (this.socket?.connected) {
      this.socket.emit("medical_record_created", data);
    }
  }

  emitMedicalRecordUpdated(data) {
    if (this.socket?.connected) {
      this.socket.emit("medical_record_updated", data);
    }
  }

  // Feedback
  emitFeedbackCreated(data) {
    if (this.socket?.connected) {
      this.socket.emit("feedback_created", data);
    }
  }

  emitFeedbackStatusUpdated(data) {
    if (this.socket?.connected) {
      this.socket.emit("feedback_status_updated", data);
    }
  }

  // Request online users
  requestOnlineUsers() {
    if (this.socket?.connected) {
      this.socket.emit("get_online_users");
    }
  }

  // Request online counts
  requestOnlineCounts() {
    if (this.socket?.connected) {
      this.socket.emit("get_online_counts");
    }
  }

  // Request online users update
  requestOnlineUsersUpdate() {
    if (this.socket?.connected) {
      this.socket.emit("online_users_updated");
    }
  }

  // Get organization-filtered online users for the current user
  getOrganizationFilteredOnlineUsers() {
    const state = store.getState();
    const onlineUsers = state.user.onlineUsers;
    return this.filterOnlineUsersByOrganization(onlineUsers);
  }

  // Get current user's organization IDs (public method for external use)
  getUserOrganizations() {
    return this.getCurrentUserOrganizations();
  }

  // Get online users for a specific organization
  getOnlineUsersForOrganization(organizationId) {
    const state = store.getState();
    return state.user.onlineUsersByOrganization[organizationId] || [];
  }

  // Get online counts for all accessible organizations
  getOnlineCountsByOrganization() {
    const state = store.getState();
    return state.user.onlineCountsByOrganization;
  }

  // Get online count for a specific organization
  getOnlineCountForOrganization(organizationId) {
    const state = store.getState();
    return state.user.onlineCountsByOrganization[organizationId] || 0;
  }

  // Get all online users across all accessible organizations
  getAllOnlineUsersByOrganization() {
    const state = store.getState();
    return state.user.onlineUsersByOrganization;
  }

  // Get current socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;
