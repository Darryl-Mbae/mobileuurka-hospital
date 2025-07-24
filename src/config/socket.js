import io from "socket.io-client";
import { store } from "./store.js";
import {
  setSocket,
  disconnectSocket,
  resetSocket,
  setConnectionError,
} from "../reducers/Slices/socketSlice.js";
import {
  setOnlineUsers,
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
} from "../reducers/Slices/patientsSlice.js";
import {
  updateOrganisation,
  setOrganisations,
} from "../reducers/Slices/organizationSlice.js";

const SERVER = import.meta.env.VITE_SOCKET_URL;

class SocketManager {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return this.socket;
    }

    this.socket = io(SERVER, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
    store.dispatch(setSocket(this.socket));

    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully to server");
      this.reconnectAttempts = 0;
      store.dispatch(setSocket(this.socket));
    });

    this.socket.on("disconnect", (reason) => {
      console.log("👋 Socket disconnected from server:", reason);
      store.dispatch(resetSocket());
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      console.error(
        "Error details:",
        error.message,
        error.description,
        error.context
      );
      store.dispatch(setConnectionError(error.message || "Connection failed"));
      this.handleReconnect();
    });

    // Online users events
    this.socket.on("online_users_updated", (onlineUsers) => {
      console.log("Received online_users_updated:", onlineUsers);
      if (Array.isArray(onlineUsers)) {
        store.dispatch(setOnlineUsers(onlineUsers.map((user) => user.userId)));
      } else {
        console.warn(
          "online_users_updated received non-array data:",
          onlineUsers
        );
        store.dispatch(setOnlineUsers([]));
      }
    });

    this.socket.on("user_online", (data) => {
      const currentOnlineUsers = store.getState().user.onlineUsers;
      if (!currentOnlineUsers.includes(data.userId)) {
        store.dispatch(setOnlineUsers([...currentOnlineUsers, data.userId]));
      }
    });

    this.socket.on("user_offline", (data) => {
      store.dispatch(userWentOffline(data));
    });

    // User events
    this.socket.on("user_updated", (userData) => {
      console.log("Received user_updated:", userData);
      store.dispatch(updateUser(userData));
    });

    this.socket.on("users_updated", (usersData) => {
      console.log("Received users_updated:", usersData);
      store.dispatch(setUsers(usersData));
    });

    this.socket.on("user_created", (userData) => {
      console.log("Received user_created:", userData);
      store.dispatch(addUser(userData));
    });

    this.socket.on("user_deleted", (userData) => {
      console.log("Received user_deleted:", userData);
      store.dispatch(deleteUser(userData));
    });

    // Organization member management events
    this.socket.on("user_added_to_organization", (data) => {
      console.log("Received user_added_to_organization:", data);
      // You might want to refresh users list or handle this specifically
      // For now, we'll treat it as a user update
      if (data.user) {
        store.dispatch(updateUser(data.user));
      }
    });

    this.socket.on("user_created_for_organization", (data) => {
      console.log("Received user_created_for_organization:", data);
      if (data.user) {
        store.dispatch(addUser(data.user));
      }
    });

    this.socket.on("user_removed_from_organization", (data) => {
      console.log("Received user_removed_from_organization:", data);
      if (data.userId) {
        store.dispatch(deleteUser({ id: data.userId }));
      }
    });

    this.socket.on("user_role_updated", (data) => {
      console.log("Received user_role_updated:", data);
      if (data.user) {
        store.dispatch(updateUser(data.user));
      }
    });
    // Patient events
    this.socket.on("patient_created", (patientData) => {
      console.log("Received patient_created:", patientData);
      store.dispatch(addPatient(patientData));
    });

    this.socket.on("patient_updated", (patientData) => {
      console.log("Received patient_updated:", patientData);
      store.dispatch(updatePatient(patientData));
    });

    this.socket.on("patient_deleted", (data) => {
      console.log("Received patient_deleted:", data);
      const patientId = data.id || data.patientId || data;
      store.dispatch(deletePatient(patientId));
    });

    this.socket.on("patients_updated", (patientsData) => {
      console.log("Received patients_updated:", patientsData);
      store.dispatch(setPatients(patientsData));
    });

    // Organization events
    this.socket.on("organization_created", (orgData) => {
      console.log("Received organization_created:", orgData);
      store.dispatch(addOrganisation(orgData));
    });

    this.socket.on("organization_updated", (orgData) => {
      console.log("Received organization_updated:", orgData);
      store.dispatch(updateOrganisation(orgData));
    });

    this.socket.on("organization_deleted", (data) => {
      console.log("Received organization_deleted:", data);
      const orgId = data.id || data.organizationId || data;
      store.dispatch(removeOrganisation(orgId));
    });

    this.socket.on("organizations_updated", (orgsData) => {
      console.log("Received organizations_updated:", orgsData);
      store.dispatch(setOrganisations(orgsData));
    });

    // Enhanced online users events with organization filtering
    this.socket.on("online_count_updated", (data) => {
      console.log("Received online_count_updated:", data);
      // You can handle organization-specific online counts here
      // For now, we'll just log it
    });

    // Medical record events (you might want to create a medical records slice)
    this.socket.on("medical_record_created", (data) => {
      console.log("Received medical_record_created:", data);
      // Handle medical record creation
    });

    this.socket.on("medical_record_updated", (data) => {
      console.log("Received medical_record_updated:", data);
      // Handle medical record update
    });

    // Feedback events (you might want to create a feedback slice)
    this.socket.on("feedback_created", (data) => {
      console.log("Received feedback_created:", data);
      // Handle feedback creation
    });

    this.socket.on("feedback_status_updated", (data) => {
      console.log("Received feedback_status_updated:", data);
      // Handle feedback status update
    });

    // Response handlers for request-response events
    this.socket.on("get_online_users_response", (data) => {
      console.log("Received get_online_users_response:", data);
      if (data.users && Array.isArray(data.users)) {
        store.dispatch(setOnlineUsers(data.users.map((user) => user.userId)));
      }
    });

    this.socket.on("get_online_counts_response", (data) => {
      console.log("Received get_online_counts_response:", data);
      // Handle online counts response
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

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, 1000 * this.reconnectAttempts);
    } else {
      console.error("❌ Max reconnection attempts reached");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      store.dispatch(disconnectSocket());
      this.socket = null;
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
