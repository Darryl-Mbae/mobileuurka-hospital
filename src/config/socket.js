import { io } from "socket.io-client";
import { 
  setOnlineUsers, 
  setOnlineUsersDetailed,
  setUser, 
  setUsers, 
  userCameOnline,
  userWentOffline,
  updateUser,
  addTypingUser,
  removeTypingUser
} from "../realtime/Slices/userSlice";
import { setOrganisations, updateOrganisation } from "../realtime/Slices/organizationSlice";
import { setPatients, addPatient, updatePatient, deletePatient } from "../realtime/Slices/patientsSlice";
import { setSocket, resetSocket } from "../realtime/Slices/socketSlice";

let socketInstance = null;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const initializeSocket = (currentUser, dispatch) => {
  if (!socketInstance && currentUser) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    // Connection events
    socketInstance.on("connect", () => {
      console.log("✅ Socket connected");
      dispatch(setSocket(socketInstance));
    });

    socketInstance.on("disconnect", () => {
      console.log("⚠️ Socket disconnected");
      dispatch(resetSocket());
    });

    // Online users events (from your backend)
    socketInstance.on("online_users_updated", (onlineUsersList) => {
      console.log("👥 Online users updated:", onlineUsersList);
      dispatch(setOnlineUsersDetailed(onlineUsersList));
    });

    socketInstance.on("user_online", (data) => {
      console.log("✅ User came online:", data);
      dispatch(userCameOnline(data));
    });

    socketInstance.on("user_offline", (data) => {
      console.log("❌ User went offline:", data);
      dispatch(userWentOffline(data));
    });

    // Legacy online users support (backward compatibility)
    socketInstance.on("online_users", (onlineUserIds) => {
      console.log("👥 Online users (legacy):", onlineUserIds);
      dispatch(setOnlineUsers(onlineUserIds));
    });

    // User events
    socketInstance.on("user_updated", (updatedUser) => {
      console.log("🧑‍⚕️ User updated:", updatedUser);
      dispatch(updateUser(updatedUser));
    });

    socketInstance.on("users_updated", (users) => {
      console.log("🧑‍⚕️ Users updated:", users);
      dispatch(setUsers(users));
    });

    // Organization-specific member events
    socketInstance.on("organization_member_online", (data) => {
      console.log("🏥👤 Organization member came online:", data);
      dispatch(userCameOnline(data));
    });

    socketInstance.on("organization_member_offline", (data) => {
      console.log("🏥👤 Organization member went offline:", data);
      dispatch(userWentOffline(data));
    });

    // Organization events
    socketInstance.on("organizations_updated", (organizations) => {
      console.log("🏥 Organizations updated:", organizations);
      dispatch(setOrganisations(organizations));
    });

    socketInstance.on("organization_updated", (updatedOrganization) => {
      console.log("🏥 Organization updated:", updatedOrganization);
      dispatch(updateOrganisation(updatedOrganization));
    });

    // Typing indicators
    socketInstance.on("user_typing", (data) => {
      console.log("⌨️ User typing:", data);
      dispatch(addTypingUser(data));
    });

    socketInstance.on("user_stopped_typing", (data) => {
      console.log("⌨️ User stopped typing:", data);
      dispatch(removeTypingUser(data));
    });

    // Patient-related events
    socketInstance.on("patient_being_viewed", (data) => {
      console.log("👁️ Patient being viewed:", data);
      // Could dispatch an action to show who's viewing a patient
    });

    socketInstance.on("patients_updated", (patients) => {
      console.log("🏥 Patients updated:", patients);
      dispatch(setPatients(patients));
    });

    socketInstance.on("patient_added", (patient) => {
      console.log("➕ Patient added:", patient);
      dispatch(addPatient(patient));
    });

    socketInstance.on("patient_updated", (patient) => {
      console.log("📝 Patient updated:", patient);
      dispatch(updatePatient(patient));
    });

    socketInstance.on("patient_deleted", (patientId) => {
      console.log("🗑️ Patient deleted:", patientId);
      dispatch(deletePatient(patientId));
    });

    // Health check
    socketInstance.on("pong", () => {
      console.log("🏓 Pong received");
    });
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const getSocket = () => socketInstance;

// Utility functions to interact with your backend socket events
export const socketUtils = {
  // Send ping for connection health
  ping: () => {
    if (socketInstance) {
      socketInstance.emit("ping");
    }
  },

  // Manual signout
  signout: () => {
    if (socketInstance) {
      socketInstance.emit("user_signout");
    }
  },

  // Join organization room
  joinOrganization: (organizationId) => {
    if (socketInstance) {
      socketInstance.emit("join_organization", organizationId);
    }
  },

  // Leave organization room
  leaveOrganization: (organizationId) => {
    if (socketInstance) {
      socketInstance.emit("leave_organization", organizationId);
    }
  },

  // Notify when viewing a patient
  viewPatient: (patientData) => {
    if (socketInstance) {
      socketInstance.emit("patient_viewed", patientData);
    }
  },

  // Typing indicators
  startTyping: (context, contextId) => {
    if (socketInstance) {
      socketInstance.emit("user_typing", { context, contextId });
    }
  },

  stopTyping: (context, contextId) => {
    if (socketInstance) {
      socketInstance.emit("user_stopped_typing", { context, contextId });
    }
  },

  // Emit user updates
  updateUser: (updatedUser) => {
    if (socketInstance) {
      socketInstance.emit("user_updated", updatedUser);
    }
  },

  updateUsers: (users) => {
    if (socketInstance) {
      socketInstance.emit("users_updated", users);
    }
  },

  // Patient-related utilities
  addPatient: (patient) => {
    if (socketInstance) {
      socketInstance.emit("patient_added", patient);
    }
  },

  updatePatient: (patient) => {
    if (socketInstance) {
      socketInstance.emit("patient_updated", patient);
    }
  },

  deletePatient: (patientId) => {
    if (socketInstance) {
      socketInstance.emit("patient_deleted", patientId);
    }
  },

  updatePatients: (patients) => {
    if (socketInstance) {
      socketInstance.emit("patients_updated", patients);
    }
  },
};

// Auto-ping every 30 seconds to maintain connection health
let pingInterval = null;

export const startHealthCheck = () => {
  if (pingInterval) clearInterval(pingInterval);
  
  pingInterval = setInterval(() => {
    socketUtils.ping();
  }, 30000); // 30 seconds
};

export const stopHealthCheck = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
};