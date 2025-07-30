# Socket Integration Guide

> **Purpose**: Complete guide to implementing real-time features with Socket.IO  
> **Prerequisites**: React, Redux, WebSocket concepts  
> **Estimated Reading Time**: 45 minutes

This comprehensive guide covers the real-time socket integration in MobileUurka, including setup, usage patterns, troubleshooting, and implementation examples.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Socket Events and Real-time Data Synchronization](#socket-events-and-real-time-data-synchronization)
4. [Working Code Examples](#working-code-examples)
5. [Implementation Patterns for New Socket Features](#implementation-patterns-for-new-socket-features)
6. [Troubleshooting Common Socket Connection Issues](#troubleshooting-common-socket-connection-issues)
7. [Best Practices](#best-practices)
8. [Environment Configuration](#environment-configuration)
9. [Security Considerations](#security-considerations)
10. [Related Documentation](#related-documentation)

## Overview

MobileUurka uses Socket.IO for real-time data synchronization across the healthcare platform. The socket integration provides:

- **Real-time Data Synchronization**: Automatic updates for patients, users, and organizations
- **Online User Tracking**: Monitor which healthcare providers are currently active
- **Connection Management**: Robust connection handling with automatic reconnection
- **Redux Integration**: Seamless state management with real-time updates
- **Authentication**: Secure token-based connection authentication

## Architecture

The socket system follows a layered architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│   useSocket()    │───▶│ Socket Manager  │
│                 │    │     Hook         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Redux Store    │◀───│  Redux Actions   │◀───│  Socket Events  │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Key Components

1. **Socket Manager** (`src/config/socket.js`): Singleton class managing connection and events
2. **useSocket Hook** (`src/hooks/useSocket.js`): React hook providing socket functionality
3. **Redux Slices**: State management for socket data and connection status
4. **Environment Configuration**: Server URL and connection settings

## Socket Events and Real-time Data Synchronization

### Connection Events

The socket system handles these connection-related events automatically:

```javascript
// Connection established
socket.on("connect", () => {
  console.log("✅ Socket connected successfully to server");
  // Updates Redux state: isConnected = true
});

// Connection lost
socket.on("disconnect", (reason) => {
  console.log("👋 Socket disconnected from server:", reason);
  // Updates Redux state: isConnected = false
});

// Connection error
socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
  // Triggers automatic reconnection logic
});
```

### User Management Events

Real-time user data synchronization:

```javascript
// Online users list updated
socket.on("online_users_updated", (onlineUsers) => {
  // Updates Redux: state.user.onlineUsers
});

// User comes online
socket.on("user_online", (data) => {
  // Adds user to online users list
});

// User goes offline
socket.on("user_offline", (data) => {
  // Removes user from online users list
});

// User data updated
socket.on("user_updated", (userData) => {
  // Updates specific user in Redux state
});

// Complete users list updated
socket.on("users_updated", (usersData) => {
  // Replaces entire users array in Redux
});

// New user created
socket.on("user_created", (userData) => {
  // Adds new user to Redux state
});

// User deleted
socket.on("user_deleted", (userData) => {
  // Removes user from Redux state
});
```

### Patient Management Events

Real-time patient data synchronization:

```javascript
// Patient data updated
socket.on("patient_updated", (patientData) => {
  // Updates specific patient in Redux state
});

// Complete patients list updated
socket.on("patients_updated", (patientsData) => {
  // Replaces entire patients array in Redux
});

// New patient created
socket.on("patient_created", (patientData) => {
  // Adds new patient to Redux state
});

// Patient deleted
socket.on("patient_deleted", (data) => {
  // Removes patient from Redux state
});
```

### Organization Management Events

Real-time organization data synchronization:

```javascript
// Organization updated
socket.on("organization_updated", (orgData) => {
  // Updates specific organization in Redux state
});

// Organizations list updated
socket.on("organizations_updated", (orgsData) => {
  // Replaces entire organizations array in Redux
});

// Organization member management
socket.on("user_added_to_organization", (data) => {
  // Handles user being added to organization
});

socket.on("user_removed_from_organization", (data) => {
  // Handles user being removed from organization
});

socket.on("user_role_updated", (data) => {
  // Handles user role changes within organization
});
```

### Medical Records and Feedback Events

Extended functionality for healthcare-specific features:

```javascript
// Medical record events
socket.on("medical_record_created", (data) => {
  // Handle new medical record creation
});

socket.on("medical_record_updated", (data) => {
  // Handle medical record updates
});

// Feedback system events
socket.on("feedback_created", (data) => {
  // Handle new feedback submission
});

socket.on("feedback_status_updated", (data) => {
  // Handle feedback status changes
});
```

## Working Code Examples

### Basic Socket Integration

Here's how to use the socket system in a React component:

```javascript
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useSocket from '../hooks/useSocket';

const PatientDashboard = () => {
  const { 
    isConnected, 
    connectionStatus,
    emitPatientUpdate,
    emitUserUpdate 
  } = useSocket();
  
  const patients = useSelector(state => state.patient.patients);
  const onlineUsers = useSelector(state => state.user.onlineUsers);

  const handlePatientUpdate = (patientData) => {
    if (isConnected) {
      emitPatientUpdate(patientData);
    }
  };

  return (
    <div className="patient-dashboard">
      <div className="connection-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        <span>({connectionStatus})</span>
      </div>
      
      <div className="online-users">
        Online Healthcare Providers: {onlineUsers.length}
      </div>
      
      <div className="patients-list">
        <h3>Patients ({patients.length})</h3>
        {patients.map(patient => (
          <div key={patient.id} className="patient-item">
            <span>{patient.name}</span>
            <button onClick={() => handlePatientUpdate({
              ...patient,
              lastUpdated: new Date().toISOString()
            })}>
              Update Patient
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientDashboard;
```

### Socket Manager Usage

Direct access to socket manager for advanced use cases:

```javascript
import socketManager from '../config/socket';

// Check connection status
const isConnected = socketManager.isConnected();

// Get socket instance
const socket = socketManager.getSocket();

// Manual connection (usually handled automatically)
const token = localStorage.getItem('access_token');
socketManager.connect(token);

// Disconnect
socketManager.disconnect();

// Emit custom events
socketManager.emitUserUpdate(userData);
socketManager.emitPatientCreated(patientData);
socketManager.emitOrganizationUpdate(orgData);

// Request data updates
socketManager.requestOnlineUsers();
socketManager.requestOnlineCounts();
```

### Redux Integration Example

Socket events automatically update Redux state. For detailed Redux patterns, see the [Redux Integration Guide](REDUX_INTEGRATION.md).

```jsx
// In your component
import { useSelector } from 'react-redux';

const MyComponent = () => {
  // These values update automatically when socket events are received
  const patients = useSelector(state => state.patient.patients);
  const users = useSelector(state => state.user.users);
  const onlineUsers = useSelector(state => state.user.onlineUsers);
  
  // Socket connection state
  const { isConnected, connectionStatus } = useSelector(state => state.socket);

  return (
    <div>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Patients: {patients.length}</p>
      <p>Online Users: {onlineUsers.length}</p>
    </div>
  );
};
```

### Authentication Integration

Socket authentication with user tokens:

```javascript
// Automatic authentication (handled by useSocket hook)
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useSocket from '../hooks/useSocket';

const App = () => {
  const { currentUser } = useSelector(state => state.user);
  const { isConnected } = useSocket();

  useEffect(() => {
    // Socket automatically connects when currentUser is available
    // Token is retrieved from localStorage
    if (currentUser && !isConnected) {
      console.log('Socket will connect automatically');
    }
  }, [currentUser, isConnected]);

  return <div>Your app content</div>;
};
```

## Implementation Patterns for New Socket Features

### Adding New Event Listeners

To add support for new socket events:

1. **Update Socket Manager** (`src/config/socket.js`):

```javascript
// In setupEventListeners method
this.socket.on("new_event_name", (data) => {
  console.log("Received new_event_name:", data);
  // Dispatch to appropriate Redux slice
  store.dispatch(handleNewEvent(data));
});
```

2. **Add Redux Action** (in appropriate slice):

```javascript
// In your Redux slice
const yourSlice = createSlice({
  name: 'yourFeature',
  initialState: {
    data: []
  },
  reducers: {
    handleNewEvent: (state, action) => {
      // Update state based on socket event
      state.data.push(action.payload);
    }
  }
});
```

3. **Add Emit Method** to Socket Manager:

```javascript
// In SocketManager class
emitNewEvent(data) {
  if (this.socket?.connected) {
    this.socket.emit("new_event_name", data);
  }
}
```

4. **Expose in useSocket Hook**:

```javascript
// In useSocket.js
const emitNewEvent = (data) => {
  socketManager.emitNewEvent(data);
};

return {
  // ... other methods
  emitNewEvent
};
```

### Creating Custom Socket Hooks

For feature-specific socket functionality:

```javascript
// hooks/usePatientSocket.js
import { useCallback } from 'react';
import useSocket from './useSocket';
import { useSelector } from 'react-redux';

export const usePatientSocket = () => {
  const { emitPatientUpdate, emitPatientCreated, isConnected } = useSocket();
  const patients = useSelector(state => state.patient.patients);

  const updatePatient = useCallback((patientData) => {
    if (isConnected) {
      emitPatientUpdate(patientData);
    }
  }, [isConnected, emitPatientUpdate]);

  const createPatient = useCallback((patientData) => {
    if (isConnected) {
      emitPatientCreated(patientData);
    }
  }, [isConnected, emitPatientCreated]);

  return {
    patients,
    updatePatient,
    createPatient,
    isConnected
  };
};
```

### Real-time Component Patterns

Pattern for components that need real-time updates:

```javascript
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useSocket from '../hooks/useSocket';

const RealTimeComponent = () => {
  const { isConnected } = useSocket();
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Get real-time data from Redux (automatically updated by socket)
  const data = useSelector(state => state.yourSlice.data);

  // Track when data was last updated
  useEffect(() => {
    setLastUpdate(new Date());
  }, [data]);

  return (
    <div className="real-time-component">
      <div className="status-bar">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Live' : '🔴 Offline'}
        </span>
        {lastUpdate && (
          <span className="last-update">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="data-display">
        {data.map(item => (
          <div key={item.id} className="data-item">
            {/* Your data display */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeComponent;
```

## Troubleshooting Common Socket Connection Issues

### Connection Problems

#### Issue: Socket not connecting

**Symptoms:**
- `isConnected` remains `false`
- Console shows connection errors
- Real-time updates not working

**Solutions:**

1. **Check Authentication:**
```javascript
// Verify token exists
const token = localStorage.getItem('access_token');
console.log('Token available:', !!token);

// Check user authentication state
const { currentUser } = useSelector(state => state.user);
console.log('Current user:', currentUser);
```

2. **Verify Environment Variables:**
```javascript
// Check if VITE_SOCKET_URL is set correctly
console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);
```

3. **Network Connectivity:**
```bash
# Test if server is reachable
curl -I http://localhost:8080/socket.io/
```

#### Issue: Frequent disconnections

**Symptoms:**
- Connection drops repeatedly
- Reconnection attempts visible in console
- Intermittent real-time updates

**Solutions:**

1. **Check Server Stability:**
```javascript
// Monitor connection events
const { connectionStatus } = useSocket();
console.log('Connection status:', connectionStatus);
```

2. **Review Network Configuration:**
```javascript
// In socket.js, adjust timeout settings
const socket = io(SERVER, {
  auth: { token },
  transports: ["websocket", "polling"],
  timeout: 30000, // Increase timeout
  forceNew: true,
});
```

3. **Monitor Reconnection Attempts:**
```javascript
// Check reconnection logic
console.log('Reconnect attempts:', socketManager.reconnectAttempts);
console.log('Max attempts:', socketManager.maxReconnectAttempts);
```

### Data Synchronization Issues

#### Issue: Redux state not updating

**Symptoms:**
- Socket events received but Redux state unchanged
- Components not re-rendering with new data
- Console shows socket events but no state updates

**Solutions:**

1. **Verify Redux Store Configuration:**
```javascript
// Check if socket slice is included in store
import { store } from '../config/store';
console.log('Store state:', store.getState());
```

2. **Check Event Handler Registration:**
```javascript
// In socket.js, verify event listeners are set up
this.socket.on("patient_updated", (patientData) => {
  console.log("Event received:", patientData);
  store.dispatch(updatePatient(patientData));
});
```

3. **Debug Redux Actions:**
```javascript
// Add logging to Redux actions
const patientsSlice = createSlice({
  name: 'patient',
  reducers: {
    updatePatient: (state, action) => {
      console.log('Redux action dispatched:', action.payload);
      // ... reducer logic
    }
  }
});
```

#### Issue: Multiple socket connections

**Symptoms:**
- Multiple connection messages in console
- Duplicate event handling
- Performance issues

**Solutions:**

1. **Verify Singleton Pattern:**
```javascript
// Socket manager should be singleton
console.log('Socket instance:', socketManager.getSocket());
console.log('Is connected:', socketManager.isConnected());
```

2. **Check Component Mounting:**
```javascript
// Ensure useSocket is not called multiple times unnecessarily
const MyComponent = () => {
  const socket = useSocket(); // Only call once per component
  
  useEffect(() => {
    // Don't create new connections in effects
    console.log('Component mounted, socket:', socket.isConnected);
  }, []); // Empty dependency array
};
```

### Performance Issues

#### Issue: Too many re-renders

**Symptoms:**
- Component performance degradation
- Excessive console logging
- UI lag during real-time updates

**Solutions:**

1. **Optimize Selectors:**
```javascript
// Use specific selectors instead of entire state
const patients = useSelector(state => state.patient.patients);
// Instead of: const state = useSelector(state => state);
```

2. **Memoize Socket Methods:**
```javascript
import { useCallback } from 'react';

const MyComponent = () => {
  const { emitPatientUpdate } = useSocket();
  
  const handleUpdate = useCallback((data) => {
    emitPatientUpdate(data);
  }, [emitPatientUpdate]);
  
  return <button onClick={() => handleUpdate(data)}>Update</button>;
};
```

3. **Debounce Frequent Updates:**
```javascript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((data) => {
  emitPatientUpdate(data);
}, 300);
```

### Debugging Tools

#### Enable Debug Mode

Add debugging to your components:

```jsx
const SocketDebugger = () => {
  const { socket, isConnected, connectionStatus } = useSocket();
  const socketState = useSelector(state => state.socket);

  return (
    <div className="socket-debugger">
      <h3>Socket Debug Info</h3>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Status: {connectionStatus}</p>
      <p>Socket ID: {socket?.id || 'N/A'}</p>
      <p>Transport: {socket?.io?.engine?.transport?.name || 'N/A'}</p>
      <p>Reconnect Attempts: {socketState.reconnectAttempts || 0}</p>
      <p>Last Error: {socketState.lastError || 'None'}</p>
    </div>
  );
};
```

#### Monitor Socket Events

```javascript
// Add to socket.js for debugging
if (process.env.NODE_ENV === 'development') {
  this.socket.onAny((eventName, ...args) => {
    console.log(`Socket event: ${eventName}`, args);
  });
}
```

#### Network Monitoring

```javascript
// Check network status
const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div>Network: {isOnline ? 'Online' : 'Offline'}</div>
  );
};
```

## Quick Reference

### Common Socket Tasks

| Task | Code Snippet | Guide Section |
|------|-------------|---------------|
| **Connect to Socket** | `const socket = useSocket();` | [useSocket Hook](#usesocket-hook) |
| **Listen to Event** | `socket.on('event', handler);` | [Event Handling](#event-handling) |
| **Emit Event** | `socket.emit('event', data);` | [Emitting Events](#emitting-events) |
| **Update Redux State** | `dispatch(updateState(data));` | [Redux Integration](#redux-integration) |
| **Handle Connection** | `socket.on('connect', callback);` | [Connection Management](#connection-management) |

### Socket Event Patterns

```javascript
// Basic event listener
useEffect(() => {
  if (socket) {
    socket.on('patients_updated', (data) => {
      dispatch(setPatients(data));
    });
    
    return () => socket.off('patients_updated');
  }
}, [socket, dispatch]);

// Emit with acknowledgment
socket.emit('update_patient', patientData, (response) => {
  if (response.success) {
    console.log('Patient updated successfully');
  }
});

// Connection status handling
const [isConnected, setIsConnected] = useState(false);
useEffect(() => {
  if (socket) {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
  }
}, [socket]);
```

### Troubleshooting Quick Fixes

| Issue | Quick Fix | Detailed Section |
|-------|-----------|------------------|
| **Connection Failed** | Check `VITE_SOCKET_URL` in `.env` | [Environment Configuration](#environment-configuration) |
| **Events Not Received** | Verify event name spelling | [Event Handling](#event-handling) |
| **Redux Not Updating** | Check dispatch in event handler | [Redux Integration](#redux-integration) |
| **Memory Leaks** | Add cleanup in useEffect return | [Best Practices](#best-practices) |

## Best Practices

### Connection Management

1. **Let the Hook Handle Connections:**
```javascript
// ✅ Good - Use the hook
const { isConnected, emitPatientUpdate } = useSocket();

// ❌ Avoid - Direct socket manager access
import socketManager from '../config/socket';
```

2. **Check Connection Before Emitting:**
```javascript
// ✅ Good - Check connection status
if (isConnected) {
  emitPatientUpdate(data);
}

// ❌ Avoid - Emit without checking
emitPatientUpdate(data);
```

3. **Handle Connection States in UI:**
```javascript
const MyComponent = () => {
  const { isConnected } = useSocket();

  return (
    <div>
      {!isConnected && (
        <div className="offline-banner">
          🔄 Reconnecting to server...
        </div>
      )}
      {/* Your component content */}
    </div>
  );
};
```

### Data Management

1. **Use Redux for Socket Data:**
```javascript
// ✅ Good - Let socket update Redux automatically
const patients = useSelector(state => state.patient.patients);

// ❌ Avoid - Manual state management for socket data
const [patients, setPatients] = useState([]);
```

2. **Emit Changes, Don't Update Local State:**
```javascript
// ✅ Good - Emit change, let socket update Redux
const handlePatientUpdate = (patientData) => {
  emitPatientUpdate(patientData);
  // Redux state will update automatically via socket event
};

// ❌ Avoid - Manual local state update
const handlePatientUpdate = (patientData) => {
  setPatients(prev => prev.map(p => p.id === patientData.id ? patientData : p));
  emitPatientUpdate(patientData);
};
```

### Performance Optimization

1. **Use Specific Selectors:**
```javascript
// ✅ Good - Specific selector
const patientCount = useSelector(state => state.patient.patients.length);

// ❌ Avoid - Broad selector
const { patients } = useSelector(state => state.patient);
const patientCount = patients.length;
```

2. **Memoize Expensive Operations:**
```javascript
import { useMemo } from 'react';

const PatientList = () => {
  const patients = useSelector(state => state.patient.patients);
  
  const sortedPatients = useMemo(() => {
    return patients.sort((a, b) => a.name.localeCompare(b.name));
  }, [patients]);

  return (
    <div>
      {sortedPatients.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
};
```

### Error Handling

1. **Graceful Degradation:**
```jsx
const PatientForm = () => {
  const { isConnected, emitPatientUpdate } = useSocket();

  const handleSubmit = (patientData) => {
    if (isConnected) {
      // Real-time update
      emitPatientUpdate(patientData);
    } else {
      // Fallback to API call
      api.updatePatient(patientData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {!isConnected && (
        <div className="warning">
          ⚠️ Working offline - changes will sync when reconnected
        </div>
      )}
      {/* Form fields */}
    </form>
  );
};
```

2. **Error Boundaries for Socket Components:**
```jsx
class SocketErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Socket component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="socket-error">
          <h3>Real-time features temporarily unavailable</h3>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Environment Configuration

### Development Setup

```env
# .env.development
VITE_SERVER_URL=http://localhost:8080/api/v1
VITE_SOCKET_URL=http://localhost:8080
```

### Production Setup

```env
# .env.production
VITE_SERVER_URL=https://your-api-domain.com/api/v1
VITE_SOCKET_URL=https://your-api-domain.com
```

### Socket Configuration Options

```javascript
// src/config/socket.js
const socket = io(SERVER, {
  auth: {
    token: token, // JWT token for authentication
  },
  transports: ["websocket", "polling"], // Fallback transports
  timeout: 20000, // Connection timeout
  forceNew: true, // Force new connection
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5, // Max reconnection attempts
  reconnectionDelay: 1000, // Delay between attempts
});
```

## Security Considerations

### Authentication

- Socket connections require valid JWT tokens
- Tokens are automatically retrieved from localStorage
- Invalid tokens result in connection rejection

### Data Validation

- All incoming socket data should be validated
- Use TypeScript or PropTypes for type checking
- Sanitize data before updating Redux state

### Error Handling

- Never expose sensitive error information
- Log security-related events for monitoring
- Implement rate limiting for socket events

## Related Documentation

### Essential Reading
- **[Redux Integration Guide](REDUX_INTEGRATION.md)** - Understanding how socket events update Redux state (see [Socket-Redux Integration](REDUX_INTEGRATION.md#integration-between-redux-and-socket-events))
- **[Form Integration Guide](FORM_INTEGRATION_GUIDE.md)** - How forms interact with real-time data updates (see [Real-time Form Updates](FORM_INTEGRATION_GUIDE.md#real-time-form-updates))

### Complementary Guides
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Socket configuration in production environments (see [WebSocket Configuration](DEPLOYMENT_GUIDE.md#websocket-configuration))

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **State Management** | [Redux Integration](#redux-integration) | [Redux Integration Guide](REDUX_INTEGRATION.md#state-management-for-real-time-updates) |
| **Error Handling** | [Error Handling](#error-handling) | [Form Error Handling](FORM_INTEGRATION_GUIDE.md#error-handling) |
| **Production Setup** | [Environment Configuration](#environment-configuration) | [Deployment Guide](DEPLOYMENT_GUIDE.md#environment-configuration) |
| **Performance** | [Best Practices](#best-practices) | [Performance Optimization](DEPLOYMENT_GUIDE.md#performance-optimization) |

---

This guide provides comprehensive coverage of the socket integration system in MobileUurka. For additional support or questions, please refer to the troubleshooting section or create an issue in the project repository.