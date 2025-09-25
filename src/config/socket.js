import io from "socket.io-client";
import {
  createEnhancedSocket,
  getAuthToken,
  getClientEnvironment,
} from "../utils/socket-connection-fix.js";
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
    this.maxReconnectAttempts = 8; // Increased for mobile
    this.baseReconnectDelay = 3000; // Longer delay for mobile
    this.maxReconnectDelay = 30000; // Longer max delay for mobile
    this.reconnectTimer = null;
    this.isReconnecting = false;
    this.isManuallyDisconnected = false;
    this.connectionStable = false;
    this.heartbeatInterval = null;
    this.lastPongTime = null;
    this.connectionTimeout = null;
    this.isAppVisible = true;

    // Add mobile-specific event listeners
    this.setupMobileEventListeners();
  }

  // Helper function to detect mobile Safari
  isMobileSafari() {
    const ua = navigator.userAgent;
    return (
      /iPhone|iPad|iPod/.test(ua) &&
      /Safari/.test(ua) &&
      !/Chrome|CriOS|FxiOS/.test(ua)
    );
  }

  // Setup mobile-specific event listeners
  setupMobileEventListeners() {
    // Handle app visibility changes (iOS Safari background/foreground)
    document.addEventListener("visibilitychange", () => {
      this.isAppVisible = !document.hidden;
      console.log(
        `📱 App visibility changed: ${this.isAppVisible ? "visible" : "hidden"}`
      );

      if (
        this.isAppVisible &&
        this.socket &&
        !this.socket.connected &&
        !this.isManuallyDisconnected
      ) {
        console.log("🔄 App became visible - checking connection");
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.manualReconnect();
          }
        }, 1000);
      }
    });

    // Handle page focus/blur
    window.addEventListener("focus", () => {
      console.log("🎯 Window focused");
      if (
        this.socket &&
        !this.socket.connected &&
        !this.isManuallyDisconnected
      ) {
        setTimeout(() => this.manualReconnect(), 500);
      }
    });

    // Handle network status changes
    window.addEventListener("online", () => {
      console.log("🌐 Network came online");
      if (!this.socket?.connected && !this.isManuallyDisconnected) {
        setTimeout(() => this.manualReconnect(), 1000);
      }
    });

    window.addEventListener("offline", () => {
      console.log("📵 Network went offline");
      store.dispatch(setConnectionError("Network connection lost"));
    });
  }

  // Helper function to detect if we're in a problematic network environment
  isProblematicNetwork() {
    // Check for mobile networks or unstable connections
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (connection) {
      return (
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g" ||
        connection.saveData === true
      );
    }
    return false;
  }

  // Helper function to get current user's organization memberships
  getCurrentUserOrganizations() {
    const state = store.getState();
    const currentUser = state.user.currentUser;
    const organizations = state.organisation.organisations;

    if (!currentUser) return [];

    const userOrganizations = organizations.filter((org) => {
      if (org.members && Array.isArray(org.members)) {
        return org.members.some(
          (member) =>
            (typeof member === "object" ? member.id : member) === currentUser.id
        );
      }
      if (org.users && Array.isArray(org.users)) {
        return org.users.some(
          (user) =>
            (typeof user === "object" ? user.id : user) === currentUser.id
        );
      }
      if (org.memberIds && Array.isArray(org.memberIds)) {
        return org.memberIds.includes(currentUser.id);
      }
      if (currentUser.organizationId) {
        return org.id === currentUser.organizationId;
      }
      return false;
    });

    return userOrganizations.map((org) => org.id);
  }

  shouldProcessEvent(eventData) {
    const userOrganizations = this.getCurrentUserOrganizations();

    if (userOrganizations.length === 0) {
      return true;
    }

    if (eventData.organizationId) {
      return userOrganizations.includes(eventData.organizationId);
    }

    if (eventData.organizationIds && Array.isArray(eventData.organizationIds)) {
      return eventData.organizationIds.some((orgId) =>
        userOrganizations.includes(orgId)
      );
    }

    if (eventData.user && eventData.user.organizationId) {
      return userOrganizations.includes(eventData.user.organizationId);
    }

    if (eventData.patient && eventData.patient.organizationId) {
      return userOrganizations.includes(eventData.patient.organizationId);
    }

    return true;
  }

  filterOnlineUsersByOrganization(onlineUsers) {
    const userOrganizations = this.getCurrentUserOrganizations();
    const state = store.getState();
    const allUsers = state.user.users;

    if (userOrganizations.length === 0) {
      return onlineUsers;
    }

    return onlineUsers.filter((onlineUserId) => {
      const user = allUsers.find((u) => u.id === onlineUserId);
      if (!user) return false;

      if (user.organizationId) {
        return userOrganizations.includes(user.organizationId);
      }

      if (user.org) {
        const currentUser = state.user.currentUser;
        const currentUserOrg = allUsers.find(
          (u) => u.id === currentUser?.id
        )?.org;
        return user.org === currentUserOrg;
      }

      if (user.organizationIds && Array.isArray(user.organizationIds)) {
        return user.organizationIds.some((orgId) =>
          userOrganizations.includes(orgId)
        );
      }

      return true;
    });
  }

  connect(token) {
    console.log("🔄 Initializing enhanced socket connection...");

    // Use provided token or get from storage
    const authToken = token || getAuthToken();
    const clientEnv = getClientEnvironment();

    console.log("📱 Client Environment:", clientEnv);
    console.log("🔗 Server URL:", SERVER);
    console.log("🔑 Token exists:", !!authToken);

    if (this.socket?.connected && this.connectionStable) {
      console.log("✅ Socket already connected and stable");
      return this.socket;
    }

    if (!authToken) {
      console.error("❌ No authentication token available");
      store.dispatch(setConnectionError("Authentication token not available"));
      return null;
    }

    // Reset manual disconnect flag
    this.isManuallyDisconnected = false;

    // Clear any existing timers
    this.clearTimers();

    // Disconnect existing socket cleanly
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    store.dispatch(setConnecting());
    console.log(
      "🔄 Connecting to socket server with enhanced configuration..."
    );

    try {
      // Use enhanced socket creation
      this.socket = createEnhancedSocket(SERVER, authToken);
      this.setupEventListeners();

      // Set connection timeout based on client environment
      const timeoutDuration = clientEnv.isSafari
        ? 180000
        : clientEnv.isSlowNetwork
        ? 120000
        : 90000; // 3min for Safari
      this.connectionTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          console.log("⏰ Connection timeout - attempting manual intervention");
          this.handleConnectionTimeout();
        }
      }, timeoutDuration);

      return this.socket;
    } catch (error) {
      console.error("❌ Failed to create enhanced socket:", error.message);
      store.dispatch(
        setConnectionError(`Socket creation failed: ${error.message}`)
      );
      return null;
    }
  }

  clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  handleConnectionTimeout() {
    console.log("🚨 Connection timeout reached");
    if (this.socket && !this.socket.connected && !this.isManuallyDisconnected) {
      this.socket.disconnect();
      store.dispatch(
        setConnectionError("Connection timeout - server may be unavailable")
      );
      this.handleReconnect("timeout");
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Clear any existing listeners
    this.socket.removeAllListeners();

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully to server");

      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.reconnectAttempts = 0;
      this.isReconnecting = false;
      this.connectionStable = true;

      this.clearTimers();

      store.dispatch(setSocket(this.socket));
      store.dispatch(clearError());
      store.dispatch(setConnectionHealth("good"));
      store.dispatch(setReconnecting(false));

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Request initial data
      this.requestOnlineUsers();
      this.requestOnlineCounts();
    });

    this.socket.on("disconnect", (reason, details) => {
      console.log("👋 Socket disconnected from server:", reason);
      console.log("Disconnect details:", details);

      this.connectionStable = false;
      this.clearTimers();
      store.dispatch(resetSocket());

      // Only attempt reconnection if not manually disconnected and reason warrants it
      if (!this.isManuallyDisconnected && this.shouldReconnect(reason)) {
        console.log("🔄 Will attempt reconnection for reason:", reason);
        this.handleReconnect(reason);
      } else {
        console.log(
          "❌ Not reconnecting. Manual disconnect:",
          this.isManuallyDisconnected,
          "Reason:",
          reason
        );
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error(
        "Error details:",
        error.message,
        error.description,
        error.context,
        error
      );

      this.connectionStable = false;
      const errorMessage = this.getErrorMessage(error);
      store.dispatch(setConnectionError(errorMessage));

      if (!this.isManuallyDisconnected) {
        this.handleReconnect("connect_error");
      }
    });

    // Enhanced error handling
    this.socket.on("error", (error) => {
      console.error("🚨 Socket error:", error);
      store.dispatch(
        setConnectionError(`Socket error: ${error.message || error}`)
      );
    });

    // Heartbeat monitoring
    this.socket.on("pong", () => {
      this.lastPongTime = Date.now();
      // console.log("💗 Heartbeat received");
    });

    // Online users events with organization filtering
    this.socket.on("online_users_updated", (data) => {
      let usersArray;
      if (Array.isArray(data)) {
        usersArray = data;
      } else if (data && Array.isArray(data.users)) {
        usersArray = data.users;
      } else {
        console.warn(
          "online_users_updated received invalid data format:",
          data
        );
        store.dispatch(setOnlineUsers([]));
        store.dispatch(setAllOnlineUsersByOrganization({}));
        return;
      }

      const userIds = usersArray.map((user) => user.userId || user.id || user);
      console.log("Raw online user IDs from server:", userIds);
      const filteredUserIds = this.filterOnlineUsersByOrganization(userIds);
      console.log("Filtered online user IDs:", filteredUserIds);

      store.dispatch(setOnlineUsers(filteredUserIds));
      this.updateOnlineUsersByOrganization(filteredUserIds);
    });

    this.socket.on("user_online", (data) => {
      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out user_online event for user not in shared organizations:",
          data.userId
        );
        return;
      }

      const currentOnlineUsers = store.getState().user.onlineUsers;
      if (!currentOnlineUsers.includes(data.userId)) {
        store.dispatch(setOnlineUsers([...currentOnlineUsers, data.userId]));
        this.addUserToOrganizationOnlineList(data.userId);
      }
    });

    this.socket.on("user_offline", (data) => {
      store.dispatch(userWentOffline(data));
    });

    // User events with organization filtering
    this.socket.on("user_updated", (userData) => {
      console.log("Received user_updated:", userData);
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log(
          "Filtered out user_updated event for user not in shared organizations:",
          userData.id
        );
        return;
      }
      store.dispatch(updateUser(userData));
    });

    this.socket.on("users_updated", (usersData) => {
      console.log("Received users_updated:", usersData);
      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredUsers = usersData;

      if (userOrganizations.length > 0) {
        filteredUsers = usersData.filter((user) => {
          if (user.organizationId) {
            return userOrganizations.includes(user.organizationId);
          }
          if (user.organizationIds && Array.isArray(user.organizationIds)) {
            return user.organizationIds.some((orgId) =>
              userOrganizations.includes(orgId)
            );
          }
          return false;
        });
      }

      store.dispatch(setUsers(filteredUsers));
    });

    this.socket.on("user_created", (userData) => {
      console.log("Received user_created:", userData);
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log(
          "Filtered out user_created event for user not in shared organizations:",
          userData.id
        );
        return;
      }
      store.dispatch(addUser(userData));
    });

    this.socket.on("user_deleted", (userData) => {
      console.log("Received user_deleted:", userData);
      if (!this.shouldProcessEvent({ user: userData })) {
        console.log(
          "Filtered out user_deleted event for user not in shared organizations:",
          userData.id
        );
        return;
      }
      store.dispatch(deleteUser(userData));
    });

    // Organization member management events
    this.socket.on("user_added_to_organization", (data) => {
      console.log("Received user_added_to_organization:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out user_added_to_organization event for organization not accessible:",
          data.organizationId
        );
        return;
      }

      if (data.user) {
        const currentUsers = store.getState().user.users;
        const existingUser = currentUsers.find((u) => u.id === data.user.id);
        if (existingUser) {
          store.dispatch(updateUser(data.user));
        } else {
          store.dispatch(addUser(data.user));
        }
      }
      if (data.organization) {
        store.dispatch(updateOrganisation(data.organization));
      }
    });

    this.socket.on("user_created_for_organization", (data) => {
      console.log("Received user_created_for_organization:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out user_created_for_organization event for organization not accessible:",
          data.organizationId
        );
        return;
      }

      if (data.user) {
        store.dispatch(addUser(data.user));
      }
    });

    this.socket.on("user_removed_from_organization", (data) => {
      console.log("Received user_removed_from_organization:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out user_removed_from_organization event for organization not accessible:",
          data.organizationId
        );
        return;
      }

      if (data.userId) {
        store.dispatch(deleteUser({ id: data.userId }));
      }
    });

    this.socket.on("user_role_updated", (data) => {
      console.log("Received user_role_updated:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out user_role_updated event for organization not accessible:",
          data.organizationId
        );
        return;
      }

      if (data.user) {
        store.dispatch(updateUser(data.user));
      }
      if (data.organization) {
        store.dispatch(updateOrganisation(data.organization));
      }
    });

    // Patient events with organization filtering
    this.socket.on("patient_created", (eventData) => {
      console.log("Received patient_created:", eventData);

      const patientData = eventData.patient || eventData;
      const filteringContext = {
        organizationId: eventData.organizationId || patientData.organizationId,
        patient: patientData,
      };

      if (!this.shouldProcessEvent(filteringContext)) {
        console.log(
          "Filtered out patient_created event for patient not in accessible organizations:",
          patientData.id
        );
        return;
      }

      console.log("Adding patient to Redux store:", patientData.id);
      store.dispatch(addPatient(patientData));
    });

    this.socket.on("patient_updated", (eventData) => {
      console.log("Received patient_updated:", eventData);

      const patientData = eventData.patient || eventData;
      const filteringContext = {
        organizationId: eventData.organizationId || patientData.organizationId,
        patient: patientData,
      };

      if (!this.shouldProcessEvent(filteringContext)) {
        console.log(
          "Filtered out patient_updated event for patient not in accessible organizations:",
          patientData.id
        );
        return;
      }

      console.log("Updating patient in Redux store:", patientData.id);
      store.dispatch(updatePatient(patientData));
    });

    this.socket.on("patient_deleted", (data) => {
      console.log("Received patient_deleted:", data);
      const patientId = data.id || data.patientId || data;
      store.dispatch(deletePatient(patientId));
    });

    this.socket.on("patients_updated", (eventData) => {
      console.log("Received patients_updated:", eventData);

      const patientsData = eventData.patients || eventData;

      if (!Array.isArray(patientsData)) {
        console.warn(
          "patients_updated received invalid data format:",
          eventData
        );
        return;
      }

      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredPatients = patientsData;

      if (userOrganizations.length > 0) {
        filteredPatients = patientsData.filter((patient) => {
          if (patient.organizationId) {
            return userOrganizations.includes(patient.organizationId);
          }
          return true;
        });
      }

      store.dispatch(setPatients(filteredPatients));
    });

    // Organization events
    this.socket.on("organization_created", (orgData) => {
      console.log("Received organization_created:", orgData);

      if (!this.shouldProcessEvent({ organizationId: orgData.id })) {
        console.log(
          "Filtered out organization_created event for organization not accessible:",
          orgData.id
        );
        return;
      }

      store.dispatch(addOrganisation(orgData));
    });

    this.socket.on("organization_updated", (orgData) => {
      console.log("Received organization_updated:", orgData);

      if (!this.shouldProcessEvent({ organizationId: orgData.id })) {
        console.log(
          "Filtered out organization_updated event for organization not accessible:",
          orgData.id
        );
        return;
      }

      store.dispatch(updateOrganisation(orgData));
    });

    this.socket.on("organization_deleted", (data) => {
      console.log("Received organization_deleted:", data);
      const orgId = data.id || data.organizationId || data;

      if (!this.shouldProcessEvent({ organizationId: orgId })) {
        console.log(
          "Filtered out organization_deleted event for organization not accessible:",
          orgId
        );
        return;
      }

      store.dispatch(removeOrganisation(orgId));
    });

    this.socket.on("organizations_updated", (orgsData) => {
      console.log("Received organizations_updated:", orgsData);

      const userOrganizations = this.getCurrentUserOrganizations();
      let filteredOrganizations = orgsData;

      if (userOrganizations.length > 0) {
        filteredOrganizations = orgsData.filter((org) =>
          userOrganizations.includes(org.id)
        );
      }

      store.dispatch(setOrganisations(filteredOrganizations));
    });

    // Online count events
    this.socket.on("online_count_updated", (data) => {
      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out online_count_updated event for organization not accessible:",
          data.organizationId
        );
        return;
      }

      if (data.organizationId && data.count !== undefined) {
        store.dispatch(
          updateOnlineCountForOrganization({
            organizationId: data.organizationId,
            count: data.count,
          })
        );
      }
    });

    // Medical record events
    this.socket.on("medical_record_created", (data) => {
      console.log("Received medical_record_created:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out medical_record_created event for record not in accessible organizations:",
          data.patientId
        );
        return;
      }

      this.handleMedicalRecordEvent(data, "created");
    });

    this.socket.on("medical_record_updated", (data) => {
      console.log("Received medical_record_updated:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out medical_record_updated event for record not in accessible organizations:",
          data.patientId
        );
        return;
      }

      this.handleMedicalRecordEvent(data, "updated");
    });

    // Feedback events
    this.socket.on("feedback_created", (data) => {
      console.log("Received feedback_created:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out feedback_created event for feedback not in accessible organizations:",
          data.organizationId
        );
        return;
      }

      if (data.chat) {
        store.dispatch(addChat(data.chat));
      }
      if (data.patient) {
        store.dispatch(updatePatient(data.patient));
      }
    });

    this.socket.on("feedback_status_updated", (data) => {
      console.log("Received feedback_status_updated:", data);

      if (!this.shouldProcessEvent(data)) {
        console.log(
          "Filtered out feedback_status_updated event for feedback not in accessible organizations:",
          data.organizationId
        );
        return;
      }

      if (data.chat) {
        store.dispatch(addChat(data.chat));
      }
      if (data.patient) {
        store.dispatch(updatePatient(data.patient));
      }
    });

    // Response handlers
    this.socket.on("get_online_users_response", (data) => {
      if (data.success && data.users && Array.isArray(data.users)) {
        const userIds = data.users.map((user) => user.userId || user.id);
        const filteredUserIds = this.filterOnlineUsersByOrganization(userIds);

        store.dispatch(setOnlineUsers(filteredUserIds));
        this.updateOnlineUsersByOrganization(filteredUserIds);
      } else if (data.error) {
        console.error("Error getting online users:", data.error);
      }
    });

    this.socket.on("get_online_counts_response", (data) => {
      if (data.success && data.counts) {
        const userOrganizations = this.getCurrentUserOrganizations();
        let filteredCounts = data.counts;

        if (userOrganizations.length > 0 && typeof data.counts === "object") {
          filteredCounts = {};
          userOrganizations.forEach((orgId) => {
            if (data.counts[orgId] !== undefined) {
              filteredCounts[orgId] = data.counts[orgId];
            }
          });
        }

        store.dispatch(setOnlineCountsByOrganization(filteredCounts));
      } else if (data.error) {
        console.error("Error getting online counts:", data.error);
      }
    });
  }

  startHeartbeat() {
    // Clear existing heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Adjust heartbeat interval for mobile Safari
    const isMobileSafari = this.isMobileSafari();
    const heartbeatInterval = isMobileSafari ? 60000 : 25000; // 60s for mobile Safari, 25s for others
    const pongTimeout = isMobileSafari ? 180000 : 70000; // 3min for mobile Safari, 70s for others

    console.log(
      `💗 Starting heartbeat - interval: ${heartbeatInterval}ms, timeout: ${pongTimeout}ms`
    );

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit("ping");

        // Check if we received pong in reasonable time
        setTimeout(() => {
          if (
            this.lastPongTime &&
            Date.now() - this.lastPongTime > pongTimeout
          ) {
            console.log("💔 Heartbeat failed - connection may be stale");
            if (!this.isReconnecting) {
              this.handleReconnect("heartbeat_failed");
            }
          }
        }, 10000); // Give 10s to receive pong
      }
    }, heartbeatInterval);

    this.lastPongTime = Date.now();
  }

  shouldReconnect(reason) {
    const noReconnectReasons = [
      "io server disconnect",
      "io client disconnect",
      "client namespace disconnect",
    ];

    return !noReconnectReasons.includes(reason) && !this.isManuallyDisconnected;
  }

  getErrorMessage(error) {
    if (!error) return "Unknown connection error";

    const errorMap = {
      timeout: "Connection timeout - please check your internet connection",
      "transport error": "Network connection failed - retrying...",
      "xhr poll error": "Network connection interrupted",
      "websocket error":
        "WebSocket connection failed - falling back to polling",
      "parse error": "Invalid server response",
      "transport close": "Connection was closed unexpectedly",
    };

    const errorType = error.type || error.message || "unknown";
    return errorMap[errorType] || `Connection failed: ${errorType}`;
  }

  calculateReconnectDelay() {
    // More aggressive backoff for mobile networks
    const isMobile = this.isMobileSafari();
    const multiplier = isMobile ? 3 : 2;

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(multiplier, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    return delay + jitter;
  }

  handleReconnect(reason = "unknown") {
    if (this.isReconnecting || this.isManuallyDisconnected) {
      console.log(
        "🔄 Reconnection already in progress or manually disconnected"
      );
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      const finalError = `Unable to reconnect after ${this.maxReconnectAttempts} attempts. Please check your internet connection and refresh the page.`;
      store.dispatch(setConnectionError(finalError));
      store.dispatch(setConnectionHealth("bad"));
      store.dispatch(setReconnecting(false));
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;
    this.connectionStable = false;

    store.dispatch(setReconnectAttempts(this.reconnectAttempts));
    store.dispatch(setReconnecting(true));

    // Set connection health
    if (this.reconnectAttempts <= 1) {
      store.dispatch(setConnectionHealth("poor"));
    } else if (this.reconnectAttempts <= 3) {
      store.dispatch(setConnectionHealth("bad"));
    }

    const delay = this.calculateReconnectDelay();
    const delaySeconds = Math.round(delay / 1000);

    console.log(
      `🔄 Attempting to reconnect in ${delaySeconds}s... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    const reconnectMessage = `Reconnecting in ${delaySeconds}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`;
    store.dispatch(setConnectionError(reconnectMessage));

    this.reconnectTimer = setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}...`);

        // Get fresh token
        const token = localStorage.getItem("access_token");
        if (token) {
          this.isReconnecting = false; // Reset flag before connecting
          this.connect(token);
        } else {
          console.error("❌ No token available for reconnection");
          store.dispatch(
            setConnectionError("Authentication token not available")
          );
          this.isReconnecting = false;
        }
      }
    }, delay);
  }

  disconnect() {
    console.log("🔌 Manually disconnecting socket");
    this.isManuallyDisconnected = true;
    this.connectionStable = false;

    this.clearTimers();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      store.dispatch(disconnectSocket());
      this.socket = null;
    }
  }

  // Manual reconnection method for user-triggered reconnects
  manualReconnect() {
    console.log("🔄 Manual reconnection requested");

    // Reset all reconnection state
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
    this.isManuallyDisconnected = false;
    this.connectionStable = false;

    this.clearTimers();

    // Clear error state
    store.dispatch(clearError());
    store.dispatch(setConnectionHealth("connecting"));

    // Disconnect existing socket cleanly
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Get token and reconnect
    const token = localStorage.getItem("access_token");

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
      isConnected: state.socket.isConnected && this.connectionStable,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastError: state.socket.lastError,
      isReconnecting: this.isReconnecting,
      connectionHealth: state.socket.connectionHealth,
    };
  }

  // Helper method to handle medical record events
  handleMedicalRecordEvent(eventData, eventType) {
    console.log(`Processing medical record ${eventType} event:`, eventData);

    const patientData = eventData.patient;

    if (patientData) {
      console.log(
        `Updating patient data for medical record ${eventType}:`,
        patientData.id
      );
      store.dispatch(updatePatient(patientData));
      return;
    }

    if (eventData.patientId) {
      const state = store.getState();
      const currentPatient = state.patient?.patients?.find(
        (p) => p.id === eventData.patientId
      );

      if (currentPatient) {
        console.log(
          `Found patient ${eventData.patientId} in state, updating with medical record ${eventType}`
        );

        const medicalRecordData = eventData.medicalRecord || eventData.record;
        const recordType =
          eventData.recordType ||
          eventData.modelName ||
          medicalRecordData?.type;

        if (medicalRecordData && recordType) {
          let mappedRecordType = recordType;
          switch (recordType) {
            case "patienthistory":
              mappedRecordType = "patientHistories";
              break;
            case "triage":
              mappedRecordType = "triage";
              break;
            case "labwork":
              mappedRecordType = "labwork";
              break;
            case "pregnancy":
            case "currentPregnancy":
              mappedRecordType = "pregnancy";
              break;
            case "infection":
              mappedRecordType = "infection";
              break;
            case "fetal":
            case "fetalInfo":
              mappedRecordType = "fetal";
              break;
          }

          store.dispatch(
            updatePatientMedicalRecord({
              patientId: eventData.patientId,
              recordType: mappedRecordType,
              recordData: medicalRecordData,
              eventType: eventType,
            })
          );

          console.log(
            `Patient ${eventData.patientId} updated with ${recordType} medical record ${eventType}`
          );
        } else {
          const updatedPatient = {
            ...currentPatient,
            lastUpdated: new Date().toISOString(),
          };
          store.dispatch(updatePatient(updatedPatient));
          console.log(
            `Patient ${eventData.patientId} timestamp updated for medical record ${eventType}`
          );
        }
      } else {
        console.log(
          `Patient ${eventData.patientId} not found in current state - medical record ${eventType} event received but cannot update UI`
        );
      }
    }

    console.log(`Medical record ${eventType} processed:`, {
      patientId: eventData.patientId,
      recordType: eventData.recordType || eventData.modelName,
      hasPatientData: !!eventData.patient,
      hasMedicalRecordData: !!(eventData.medicalRecord || eventData.record),
      recordDataKeys: eventData.record ? Object.keys(eventData.record) : [],
    });
  }

  // Helper method to update organization-specific online users
  updateOnlineUsersByOrganization(filteredUserIds) {
    const state = store.getState();
    const allUsers = state.user.users;
    const userOrganizations = this.getCurrentUserOrganizations();

    const onlineUsersByOrg = {};

    userOrganizations.forEach((orgId) => {
      onlineUsersByOrg[orgId] = [];
    });

    filteredUserIds.forEach((userId) => {
      const user = allUsers.find((u) => u.id === userId);
      if (user) {
        if (
          user.organizationId &&
          userOrganizations.includes(user.organizationId)
        ) {
          if (!onlineUsersByOrg[user.organizationId]) {
            onlineUsersByOrg[user.organizationId] = [];
          }
          onlineUsersByOrg[user.organizationId].push(userId);
        }

        if (user.organizationIds && Array.isArray(user.organizationIds)) {
          user.organizationIds.forEach((orgId) => {
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

    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      if (
        user.organizationId &&
        userOrganizations.includes(user.organizationId)
      ) {
        store.dispatch(
          addOnlineUserToOrganization({
            organizationId: user.organizationId,
            userId: userId,
          })
        );
      }

      if (user.organizationIds && Array.isArray(user.organizationIds)) {
        user.organizationIds.forEach((orgId) => {
          if (userOrganizations.includes(orgId)) {
            store.dispatch(
              addOnlineUserToOrganization({
                organizationId: orgId,
                userId: userId,
              })
            );
          }
        });
      }
    }
  }

  // Emit methods
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

  requestOnlineUsers() {
    if (this.socket?.connected) {
      this.socket.emit("get_online_users");
    }
  }

  requestOnlineCounts() {
    if (this.socket?.connected) {
      this.socket.emit("get_online_counts");
    }
  }

  requestOnlineUsersUpdate() {
    if (this.socket?.connected) {
      this.socket.emit("online_users_updated");
    }
  }

  getOrganizationFilteredOnlineUsers() {
    const state = store.getState();
    const onlineUsers = state.user.onlineUsers;
    return this.filterOnlineUsersByOrganization(onlineUsers);
  }

  getUserOrganizations() {
    return this.getCurrentUserOrganizations();
  }

  getOnlineUsersForOrganization(organizationId) {
    const state = store.getState();
    return state.user.onlineUsersByOrganization[organizationId] || [];
  }

  getOnlineCountsByOrganization() {
    const state = store.getState();
    return state.user.onlineCountsByOrganization;
  }

  getOnlineCountForOrganization(organizationId) {
    const state = store.getState();
    return state.user.onlineCountsByOrganization[organizationId] || 0;
  }

  getAllOnlineUsersByOrganization() {
    const state = store.getState();
    return state.user.onlineUsersByOrganization;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return (this.socket?.connected && this.connectionStable) || false;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager;
