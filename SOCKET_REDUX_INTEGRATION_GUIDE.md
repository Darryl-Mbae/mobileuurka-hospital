# Socket.IO + Redux Integration Guide

This guide explains how to integrate Socket.IO with Redux for real-time updates in your React application.

## Overview

The integration consists of:
- **Socket Manager**: Handles connection and event management
- **Redux Slices**: Store socket state and real-time data
- **React Hook**: Easy-to-use hook for components
- **Components**: UI components that react to real-time updates

## Architecture

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

## Files Structure

```
src/
├── config/
│   ├── socket.js          # Socket manager with Redux integration
│   └── store.js           # Redux store configuration
├── hooks/
│   └── useSocket.js       # React hook for socket usage
├── reducers/Slices/
│   ├── socketSlice.js     # Socket connection state
│   ├── userSlice.js       # User data with online status
│   ├── patientsSlice.js   # Patient data updates
│   └── organizationSlice.js # Organization updates
└── components/
    └── SocketStatus.jsx   # Connection status component
```

## Setup Steps

### 1. Socket Manager (`src/config/socket.js`)

The socket manager handles:
- Connection management with authentication
- Automatic reconnection
- Event listening and Redux dispatch
- Helper methods for emitting events

Key features:
- Singleton pattern for single connection
- Automatic Redux state updates
- Error handling and reconnection logic

### 2. Redux Slices

#### Socket Slice (`src/reducers/Slices/socketSlice.js`)
Manages connection state:
```javascript
const initialState = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  reconnectAttempts: 0,
  lastError: null,
};
```

#### User Slice (`src/reducers/Slices/userSlice.js`)
Handles online users:
```javascript
const initialState = {
  currentUser: null,
  onlineUsers: [],
  users: [],
};
```

### 3. React Hook (`src/hooks/useSocket.js`)

Provides easy access to socket functionality:
```javascript
const { 
  socket, 
  isConnected, 
  connectionStatus,
  emitUserUpdate,
  emitPatientUpdate 
} = useSocket();
```

## Usage Examples

### Basic Component Usage

```javascript
import useSocket from '../hooks/useSocket';

const MyComponent = () => {
  const { isConnected, emitPatientUpdate } = useSocket();
  
  const handlePatientUpdate = (patientData) => {
    // This will broadcast to all connected clients
    emitPatientUpdate(patientData);
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={() => handlePatientUpdate(data)}>
        Update Patient
      </button>
    </div>
  );
};
```

### Accessing Real-time Data

```javascript
import { useSelector } from 'react-redux';

const PatientsList = () => {
  const patients = useSelector(state => state.patient.patients);
  const onlineUsers = useSelector(state => state.user.onlineUsers);
  
  // Patients list automatically updates when socket events are received
  return (
    <div>
      <h3>Patients ({patients.length})</h3>
      <p>Online Users: {onlineUsers.length}</p>
      {patients.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
};
```

### Connection Status Component

```javascript
import SocketStatus from '../components/SocketStatus';

const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* Other sidebar content */}
      <SocketStatus />
    </div>
  );
};
```

## Real-time Events

### Automatic Events (handled by socket manager):

1. **Connection Events**:
   - `connect` - Updates connection status
   - `disconnect` - Resets connection state
   - `connect_error` - Handles connection errors

2. **User Events**:
   - `online_users_updated` - Updates online users list
   - `user_online` - Adds user to online list
   - `user_offline` - Removes user from online list
   - `user_updated` - Updates user data
   - `users_updated` - Updates entire users list

3. **Patient Events**:
   - `patient_updated` - Updates single patient
   - `patients_updated` - Updates patients list

4. **Organization Events**:
   - `organization_updated` - Updates single organization
   - `organizations_updated` - Updates organizations list

### Manual Events (emit from components):

```javascript
const { emitUserUpdate, emitPatientUpdate, emitOrganizationUpdate } = useSocket();

// Update user data
emitUserUpdate({ id: 1, name: 'Updated Name' });

// Update patient data
emitPatientUpdate({ id: 1, status: 'Updated Status' });

// Update organization data
emitOrganizationUpdate({ id: 1, name: 'Updated Org' });
```

## Server-side Requirements

Your server should handle these events:

```javascript
// Server-side event handlers (from your provided code)
const updateHandlers = {
  organization_updated: (io, data) => io.emit("organization_updated", data),
  organizations_updated: (io, data) => io.emit("organizations_updated", data),
  patient_updated: (io, data) => io.emit("patient_updated", data),
  patients_updated: (io, data) => io.emit("patients_updated", data),
  user_updated: (io, data) => io.emit("user_updated", data),
  users_updated: (io, data) => io.emit("users_updated", data),
  online_users_updated: (io, data) => io.emit("online_users_updated", data),
};
```

## Authentication

The socket connects with user token:
```javascript
// Automatically handled when user is logged in
const socket = io(SERVER, {
  auth: {
    token: currentUser.token
  }
});
```

## Error Handling

The system includes:
- Automatic reconnection (up to 5 attempts)
- Connection error tracking
- Graceful degradation when offline

## Best Practices

### 1. Component Usage
```javascript
// ✅ Good - Use the hook
const { isConnected, emitPatientUpdate } = useSocket();

// ❌ Avoid - Direct socket access
import socketManager from '../config/socket';
```

### 2. Data Updates
```javascript
// ✅ Good - Let socket handle Redux updates
emitPatientUpdate(patientData);

// ❌ Avoid - Manual Redux dispatch for socket data
dispatch(updatePatient(patientData));
```

### 3. Connection Status
```javascript
// ✅ Good - Check connection before emitting
if (isConnected) {
  emitPatientUpdate(data);
}
```

## Troubleshooting

### Common Issues:

1. **Socket not connecting**:
   - Check if user is authenticated
   - Verify server URL in environment variables
   - Check browser network tab for connection errors

2. **Events not updating Redux**:
   - Ensure socket manager is imported in App.js
   - Check if Redux store is properly configured
   - Verify event names match server-side

3. **Multiple connections**:
   - Socket manager uses singleton pattern
   - Only one connection per user session

### Debug Mode:

Add to your component:
```javascript
const { socket, connectionStatus } = useSocket();

console.log('Socket status:', connectionStatus);
console.log('Socket instance:', socket);
```

## Performance Considerations

- Socket connection is established once per user session
- Redux updates are batched automatically
- Components re-render only when relevant data changes
- Automatic cleanup on component unmount

## Security Notes

- Authentication token is required for connection
- Users only receive updates for their organization
- Server validates all incoming events
- Connection is automatically terminated for unauthorized users

This integration provides a robust, scalable solution for real-time updates in your React application with proper state management through Redux