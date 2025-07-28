# Redux Integration Guide

> **Purpose**: Complete guide to Redux Toolkit patterns and real-time state management  
> **Prerequisites**: React, Redux concepts, state management experience  
> **Estimated Reading Time**: 45 minutes

This guide covers Redux state management patterns used in MobileUurka, including Redux Toolkit setup, slice patterns, real-time state updates, and integration with socket events.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Store Configuration](#store-configuration)
4. [Redux Slice Patterns](#redux-slice-patterns)
5. [State Management for Real-time Updates](#state-management-for-real-time-updates)
6. [Integration Between Redux and Socket Events](#integration-between-redux-and-socket-events)
7. [Creating New Redux Slices and Actions](#creating-new-redux-slices-and-actions)
8. [Best Practices](#best-practices)
9. [Debugging Redux](#debugging-redux)

## Overview

MobileUurka uses Redux Toolkit for predictable state management across the healthcare platform. The Redux integration provides:

- **Centralized State Management**: Single source of truth for application data
- **Real-time State Updates**: Automatic state synchronization via socket events
- **Predictable State Changes**: Immutable updates with Redux Toolkit
- **Developer Experience**: Enhanced debugging with Redux DevTools
- **Type Safety**: Structured state management with clear action patterns

## Architecture

The Redux architecture follows the standard Redux Toolkit pattern with real-time enhancements:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│   useSelector    │◀───│  Redux Store    │
│                 │    │   useDispatch    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       ▲
         │                       ▼                       │
         │              ┌──────────────────┐             │
         └─────────────▶│  Action Creators │─────────────┘
                        │                  │
                        └──────────────────┘
                                 ▲
                                 │
                        ┌──────────────────┐
                        │  Socket Events   │
                        │  (Auto Dispatch) │
                        └──────────────────┘
```

### Key Components

1. **Store Configuration** (`src/config/store.js`): Central store setup with all slices
2. **Redux Slices**: Feature-based state management with actions and reducers
3. **Socket Integration**: Automatic state updates from real-time events
4. **Selector Patterns**: Efficient state access in components

## Store Configuration

### Basic Store Setup

```javascript
// src/config/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../reducers/Slices/userSlice.js";
import organisationReducer from "../reducers/Slices/organizationSlice.js";
import patientReducer from "../reducers/Slices/patientsSlice.js";
import socketReducer from "../reducers/Slices/socketSlice.js";
import chatsReducer from "../reducers/Slices/chatSlice.js";

export const store = configureStore({
  reducer: {
    user: userReducer,
    organisation: organisationReducer,
    patient: patientReducer,
    socket: socketReducer,
    chats: chatsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabled for socket instances
    }),
});

export default store;
```

### Store Features

- **Redux Toolkit**: Modern Redux with less boilerplate
- **Serializable Check Disabled**: Allows socket instances in state
- **DevTools Integration**: Automatic Redux DevTools support
- **Middleware Support**: Custom middleware can be added

## Redux Slice Patterns

### Standard Slice Structure

All slices follow a consistent pattern:

```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Define initial state structure
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    // Synchronous actions
    setItems: (state, action) => {
      state.items = action.payload;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    selectItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    clearSelection: (state) => {
      state.selectedItem = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setItems,
  addItem,
  updateItem,
  deleteItem,
  selectItem,
  clearSelection,
  setLoading,
  setError,
} = featureSlice.actions;

export default featureSlice.reducer;
```

### User Slice Example

```javascript
// src/reducers/Slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  onlineUsers: [], // Array of user IDs who are online
  users: [], // All users list
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    userWentOffline: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    updateUser: (state, action) => {
      const updatedUser = action.payload;
      // Update in users array
      const userIndex = state.users.findIndex(user => user.id === updatedUser.id);
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updatedUser };
      }
      // Update current user if it's the same user
      if (state.currentUser && state.currentUser.id === updatedUser.id) {
        state.currentUser = { ...state.currentUser, ...updatedUser };
      }
    },
    addUser: (state, action) => {
      const newUser = action.payload;
      // Check if user already exists to avoid duplicates
      const existingUserIndex = state.users.findIndex(user => user.id === newUser.id);
      if (existingUserIndex === -1) {
        state.users.push(newUser);
      }
    },
    deleteUser: (state, action) => {
      const userId = action.payload.id || action.payload;
      state.users = state.users.filter(user => user.id !== userId);
      // Remove from online users if they were online
      state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.onlineUsers = [];
    },
  },
});

export const { 
  setUser, 
  setUsers, 
  setOnlineUsers, 
  userWentOffline,
  updateUser,
  addUser,
  deleteUser,
  logoutUser 
} = userSlice.actions;

export default userSlice.reducer;
```

### Patient Slice Example

```javascript
// src/reducers/Slices/patientsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
  selectedPatient: null,
};

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.push(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.patients[index] = action.payload;
      }
    },
    deletePatient: (state, action) => {
      state.patients = state.patients.filter(p => p.id !== action.payload);
    },
    selectPatient: (state, action) => {
      state.selectedPatient = action.payload;
    },
    clearSelectedPatient: (state) => {
      state.selectedPatient = null;
    }
  },
});

export const {
  setPatients,
  addPatient,
  updatePatient,
  deletePatient,
  selectPatient,
  clearSelectedPatient
} = patientSlice.actions;

export default patientSlice.reducer;
```

### Socket Slice Example

```javascript
// src/reducers/Slices/socketSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected', // 'connecting', 'connected', 'disconnected', 'error'
  reconnectAttempts: 0,
  lastError: null,
};

export const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
      state.isConnected = true;
      state.connectionStatus = 'connected';
      state.reconnectAttempts = 0;
      state.lastError = null;
    },
    setConnecting: (state) => {
      state.connectionStatus = 'connecting';
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
      }
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
    resetSocket: (state) => {
      state.socket = null;
      state.isConnected = false;
      state.connectionStatus = 'disconnected';
    },
    setConnectionError: (state, action) => {
      state.connectionStatus = 'error';
      state.lastError = action.payload;
      state.reconnectAttempts += 1;
    },
    clearError: (state) => {
      state.lastError = null;
    },
  },
});

export const { 
  setSocket, 
  setConnecting,
  disconnectSocket, 
  resetSocket, 
  setConnectionError,
  clearError 
} = socketSlice.actions;

export default socketSlice.reducer;
```

## State Management for Real-time Updates

### Automatic State Updates via Socket Events

The socket integration automatically dispatches Redux actions when events are received:

```javascript
// In src/config/socket.js
import { store } from "./store.js";
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

// Socket event handlers automatically update Redux state
this.socket.on("user_updated", (userData) => {
  console.log("Received user_updated:", userData);
  store.dispatch(updateUser(userData));
});

this.socket.on("users_updated", (usersData) => {
  console.log("Received users_updated:", usersData);
  store.dispatch(setUsers(usersData));
});

this.socket.on("patient_created", (patientData) => {
  console.log("Received patient_created:", patientData);
  store.dispatch(addPatient(patientData));
});

this.socket.on("patient_updated", (patientData) => {
  console.log("Received patient_updated:", patientData);
  store.dispatch(updatePatient(patientData));
});
```

### Real-time State Flow

1. **User Action**: Component triggers an action (e.g., update patient)
2. **Socket Emit**: Action emits socket event to server
3. **Server Broadcast**: Server broadcasts update to all connected clients
4. **Socket Receive**: Client receives socket event
5. **Redux Dispatch**: Socket handler automatically dispatches Redux action
6. **State Update**: Redux updates state immutably
7. **Component Re-render**: Components using the state re-render automatically

```javascript
// Example flow for patient update
const PatientForm = () => {
  const { emitPatientUpdate } = useSocket();
  const dispatch = useDispatch();

  const handleSubmit = (patientData) => {
    // 1. User action - form submission
    
    // 2. Socket emit - send to server
    emitPatientUpdate(patientData);
    
    // 3-7. Automatic: Server broadcasts → Socket receives → Redux updates → Re-render
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

## Integration Between Redux and Socket Events

### Socket Event to Redux Action Mapping

| Socket Event | Redux Action | Slice | Purpose |
|-------------|-------------|-------|---------|
| `user_updated` | `updateUser` | user | Update specific user data |
| `users_updated` | `setUsers` | user | Replace entire users list |
| `user_created` | `addUser` | user | Add new user to list |
| `user_deleted` | `deleteUser` | user | Remove user from list |
| `online_users_updated` | `setOnlineUsers` | user | Update online users list |
| `user_offline` | `userWentOffline` | user | Remove user from online list |
| `patient_created` | `addPatient` | patient | Add new patient |
| `patient_updated` | `updatePatient` | patient | Update patient data |
| `patient_deleted` | `deletePatient` | patient | Remove patient |
| `patients_updated` | `setPatients` | patient | Replace patients list |
| `organization_updated` | `updateOrganisation` | organisation | Update organization |
| `organizations_updated` | `setOrganisations` | organisation | Replace organizations list |

### Custom Socket Event Handlers

To add new socket events that update Redux state:

```javascript
// 1. Add reducer to appropriate slice
const yourSlice = createSlice({
  name: 'yourFeature',
  initialState: { items: [] },
  reducers: {
    handleCustomEvent: (state, action) => {
      // Handle the custom event data
      state.items.push(action.payload);
    },
  },
});

// 2. Add socket event handler in socket.js
this.socket.on("custom_event", (data) => {
  console.log("Received custom_event:", data);
  store.dispatch(handleCustomEvent(data));
});

// 3. Add emit method to socket manager
emitCustomEvent(data) {
  if (this.socket?.connected) {
    this.socket.emit("custom_event", data);
  }
}
```

### State Synchronization Patterns

#### Optimistic Updates

For better user experience, implement optimistic updates:

```jsx
const PatientList = () => {
  const dispatch = useDispatch();
  const { emitPatientUpdate } = useSocket();
  const patients = useSelector(state => state.patient.patients);

  const handlePatientUpdate = async (patientData) => {
    // Optimistic update - update UI immediately
    dispatch(updatePatient(patientData));
    
    try {
      // Emit socket event
      emitPatientUpdate(patientData);
      
      // Real update will come via socket event and override optimistic update
    } catch (error) {
      // Revert optimistic update on error
      dispatch(revertPatientUpdate(patientData.id));
    }
  };

  return (
    <div>
      {patients.map(patient => (
        <PatientCard 
          key={patient.id} 
          patient={patient}
          onUpdate={handlePatientUpdate}
        />
      ))}
    </div>
  );
};
```

#### Conflict Resolution

Handle conflicts when multiple users edit the same data:

```javascript
const conflictResolutionSlice = createSlice({
  name: 'conflictResolution',
  initialState: {
    conflicts: [],
  },
  reducers: {
    addConflict: (state, action) => {
      state.conflicts.push(action.payload);
    },
    resolveConflict: (state, action) => {
      state.conflicts = state.conflicts.filter(
        conflict => conflict.id !== action.payload.id
      );
    },
  },
});

// In socket event handler
this.socket.on("data_conflict", (conflictData) => {
  store.dispatch(addConflict(conflictData));
});
```

## Creating New Redux Slices and Actions

### Step-by-Step Guide

#### 1. Create the Slice File

```javascript
// src/reducers/Slices/newFeatureSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  filters: {
    search: '',
    category: 'all',
  },
};

const newFeatureSlice = createSlice({
  name: 'newFeature',
  initialState,
  reducers: {
    // Basic CRUD operations
    setItems: (state, action) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteItem: (state, action) => {
      const itemId = action.payload.id || action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
    },
    
    // Selection management
    selectItem: (state, action) => {
      state.selectedItem = action.payload;
    },
    clearSelection: (state) => {
      state.selectedItem = null;
    },
    
    // Loading and error states
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    
    // Filtering
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    // Bulk operations
    bulkUpdate: (state, action) => {
      const updates = action.payload;
      updates.forEach(update => {
        const index = state.items.findIndex(item => item.id === update.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...update };
        }
      });
    },
    bulkDelete: (state, action) => {
      const idsToDelete = action.payload;
      state.items = state.items.filter(item => !idsToDelete.includes(item.id));
    },
  },
});

export const {
  setItems,
  addItem,
  updateItem,
  deleteItem,
  selectItem,
  clearSelection,
  setLoading,
  setError,
  clearError,
  setFilter,
  clearFilters,
  bulkUpdate,
  bulkDelete,
} = newFeatureSlice.actions;

export default newFeatureSlice.reducer;
```

#### 2. Add to Store Configuration

```javascript
// src/config/store.js
import newFeatureReducer from "../reducers/Slices/newFeatureSlice.js";

export const store = configureStore({
  reducer: {
    // ... existing reducers
    newFeature: newFeatureReducer,
  },
  // ... rest of configuration
});
```

#### 3. Create Selectors

```javascript
// src/selectors/newFeatureSelectors.js
import { createSelector } from '@reduxjs/toolkit';

// Basic selectors
export const selectNewFeatureState = (state) => state.newFeature;
export const selectItems = (state) => state.newFeature.items;
export const selectSelectedItem = (state) => state.newFeature.selectedItem;
export const selectLoading = (state) => state.newFeature.loading;
export const selectError = (state) => state.newFeature.error;
export const selectFilters = (state) => state.newFeature.filters;

// Memoized selectors
export const selectFilteredItems = createSelector(
  [selectItems, selectFilters],
  (items, filters) => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category === 'all' || item.category === filters.category;
      return matchesSearch && matchesCategory;
    });
  }
);

export const selectItemById = createSelector(
  [selectItems, (state, itemId) => itemId],
  (items, itemId) => items.find(item => item.id === itemId)
);

export const selectItemsCount = createSelector(
  [selectItems],
  (items) => items.length
);
```

#### 4. Create Custom Hook

```javascript
// src/hooks/useNewFeature.js
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import {
  setItems,
  addItem,
  updateItem,
  deleteItem,
  selectItem,
  clearSelection,
  setLoading,
  setError,
  setFilter,
} from '../reducers/Slices/newFeatureSlice';
import {
  selectItems,
  selectSelectedItem,
  selectLoading,
  selectError,
  selectFilteredItems,
} from '../selectors/newFeatureSelectors';

export const useNewFeature = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const items = useSelector(selectItems);
  const filteredItems = useSelector(selectFilteredItems);
  const selectedItem = useSelector(selectSelectedItem);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);

  // Actions
  const setItemsData = useCallback((items) => {
    dispatch(setItems(items));
  }, [dispatch]);

  const addNewItem = useCallback((item) => {
    dispatch(addItem(item));
  }, [dispatch]);

  const updateExistingItem = useCallback((item) => {
    dispatch(updateItem(item));
  }, [dispatch]);

  const removeItem = useCallback((itemId) => {
    dispatch(deleteItem(itemId));
  }, [dispatch]);

  const selectItemById = useCallback((item) => {
    dispatch(selectItem(item));
  }, [dispatch]);

  const clearItemSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);

  const setLoadingState = useCallback((isLoading) => {
    dispatch(setLoading(isLoading));
  }, [dispatch]);

  const setErrorState = useCallback((error) => {
    dispatch(setError(error));
  }, [dispatch]);

  const updateFilter = useCallback((filterUpdate) => {
    dispatch(setFilter(filterUpdate));
  }, [dispatch]);

  return {
    // State
    items,
    filteredItems,
    selectedItem,
    loading,
    error,
    
    // Actions
    setItemsData,
    addNewItem,
    updateExistingItem,
    removeItem,
    selectItemById,
    clearItemSelection,
    setLoadingState,
    setErrorState,
    updateFilter,
  };
};
```

#### 5. Use in Components

```javascript
// src/components/NewFeatureList.jsx
import React, { useEffect } from 'react';
import { useNewFeature } from '../hooks/useNewFeature';

const NewFeatureList = () => {
  const {
    filteredItems,
    selectedItem,
    loading,
    error,
    selectItemById,
    updateFilter,
    removeItem,
  } = useNewFeature();

  const handleSearch = (searchTerm) => {
    updateFilter({ search: searchTerm });
  };

  const handleItemClick = (item) => {
    selectItemById(item);
  };

  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure?')) {
      removeItem(itemId);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="new-feature-list">
      <input
        type="text"
        placeholder="Search items..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      <div className="items-grid">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className={`item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewFeatureList;
```

### Advanced Patterns

#### Async Actions with Redux Toolkit Query

For complex async operations, consider using RTK Query:

```javascript
// src/api/newFeatureApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const newFeatureApi = createApi({
  reducerPath: 'newFeatureApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/new-feature/',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['NewFeatureItem'],
  endpoints: (builder) => ({
    getItems: builder.query({
      query: () => '',
      providesTags: ['NewFeatureItem'],
    }),
    createItem: builder.mutation({
      query: (newItem) => ({
        url: '',
        method: 'POST',
        body: newItem,
      }),
      invalidatesTags: ['NewFeatureItem'],
    }),
    updateItem: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['NewFeatureItem'],
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['NewFeatureItem'],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = newFeatureApi;
```

#### Middleware for Socket Integration

Create middleware to handle socket events automatically:

```javascript
// src/middleware/socketMiddleware.js
const socketMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Auto-emit socket events for certain actions
  if (action.type.endsWith('/addItem')) {
    const socketManager = require('../config/socket').default;
    socketManager.emitItemCreated(action.payload);
  }
  
  if (action.type.endsWith('/updateItem')) {
    const socketManager = require('../config/socket').default;
    socketManager.emitItemUpdated(action.payload);
  }
  
  return result;
};

// Add to store configuration
export const store = configureStore({
  reducer: {
    // ... reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(socketMiddleware),
});
```

## Quick Reference

### Essential Redux Patterns

| Task | Code Pattern | Guide Section |
|------|-------------|---------------|
| **Access State** | `const data = useSelector(state => state.slice.data);` | [Using State](#using-state) |
| **Dispatch Action** | `const dispatch = useDispatch(); dispatch(action(payload));` | [Dispatching Actions](#dispatching-actions) |
| **Create Slice** | `createSlice({ name, initialState, reducers })` | [Creating New Redux Slices](#creating-new-redux-slices-and-actions) |
| **Async Action** | `createAsyncThunk('name', async (payload) => { ... })` | [Async Actions](#async-actions) |

### Common Redux Toolkit Patterns

```javascript
// Basic slice structure
const sliceTemplate = createSlice({
  name: 'feature',
  initialState: {
    data: [],
    loading: false,
    error: null
  },
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

// Component usage
const Component = () => {
  const { data, loading, error } = useSelector(state => state.feature);
  const dispatch = useDispatch();
  
  const handleUpdate = (newData) => {
    dispatch(setData(newData));
  };
  
  return <div>{/* Component JSX */}</div>;
};
```

### Socket-Redux Integration Patterns

| Socket Event | Redux Action | Pattern |
|-------------|-------------|---------|
| **Data Update** | `dispatch(setData(socketData))` | Direct state update |
| **Real-time Sync** | `dispatch(updateItem(socketData))` | Partial state update |
| **Connection Status** | `dispatch(setConnectionStatus(status))` | Connection tracking |

### State Management Quick Fixes

| Issue | Quick Fix | Detailed Section |
|-------|-----------|------------------|
| **State Not Updating** | Check if reducer is properly mutating state | [Redux Slice Patterns](#redux-slice-patterns) |
| **Component Not Re-rendering** | Verify useSelector dependency | [Performance Optimization](#performance-optimization) |
| **Socket Events Not Working** | Check event handler dispatch calls | [Socket Integration](#integration-between-redux-and-socket-events) |
| **Async Actions Failing** | Add error handling in createAsyncThunk | [Error Handling](#error-handling) |

## Best Practices

### State Structure

1. **Keep State Normalized:**
```javascript
// ✅ Good - Normalized state
const initialState = {
  users: {
    byId: {},
    allIds: [],
  },
  selectedUserId: null,
};

// ❌ Avoid - Nested/denormalized state
const initialState = {
  users: [
    {
      id: 1,
      name: 'John',
      posts: [
        { id: 1, title: 'Post 1', author: { id: 1, name: 'John' } }
      ]
    }
  ]
};
```

2. **Use Consistent Naming:**
```javascript
// ✅ Good - Consistent action names
const slice = createSlice({
  name: 'users',
  reducers: {
    setUsers: (state, action) => { /* ... */ },
    addUser: (state, action) => { /* ... */ },
    updateUser: (state, action) => { /* ... */ },
    deleteUser: (state, action) => { /* ... */ },
  },
});

// ❌ Avoid - Inconsistent naming
const slice = createSlice({
  name: 'users',
  reducers: {
    loadUsers: (state, action) => { /* ... */ },
    createNewUser: (state, action) => { /* ... */ },
    modifyUser: (state, action) => { /* ... */ },
    removeUser: (state, action) => { /* ... */ },
  },
});
```

### Performance Optimization

1. **Use Memoized Selectors:**
```javascript
import { createSelector } from '@reduxjs/toolkit';

// ✅ Good - Memoized selector
const selectFilteredUsers = createSelector(
  [selectUsers, selectFilter],
  (users, filter) => users.filter(user => user.name.includes(filter))
);

// ❌ Avoid - Computing in component
const MyComponent = () => {
  const users = useSelector(state => state.users);
  const filter = useSelector(state => state.filter);
  const filteredUsers = users.filter(user => user.name.includes(filter)); // Recalculates on every render
};
```

2. **Specific Selectors:**
```javascript
// ✅ Good - Specific selector
const userName = useSelector(state => state.user.currentUser?.name);

// ❌ Avoid - Broad selector
const { currentUser } = useSelector(state => state.user);
const userDisplayName = currentUser?.name;
```

### Error Handling

1. **Consistent Error State:**
```javascript
const initialState = {
  data: [],
  loading: false,
  error: null, // Always include error state
};

const slice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
      if (action.payload) {
        state.error = null; // Clear error when starting new operation
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});
```

2. **Error Boundaries for Redux Components:**
```jsx
const ReduxErrorBoundary = ({ children }) => {
  const error = useSelector(state => state.app.error);
  
  if (error) {
    return (
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }
  
  return children;
};
```

### Testing Redux Code

1. **Test Reducers:**
```javascript
// tests/userSlice.test.js
import userReducer, { addUser, updateUser } from '../src/reducers/Slices/userSlice';

describe('userSlice', () => {
  const initialState = {
    users: [],
    currentUser: null,
  };

  it('should add a user', () => {
    const newUser = { id: 1, name: 'John Doe' };
    const action = addUser(newUser);
    const state = userReducer(initialState, action);
    
    expect(state.users).toHaveLength(1);
    expect(state.users[0]).toEqual(newUser);
  });

  it('should update a user', () => {
    const existingState = {
      users: [{ id: 1, name: 'John Doe' }],
      currentUser: null,
    };
    const updatedUser = { id: 1, name: 'Jane Doe' };
    const action = updateUser(updatedUser);
    const state = userReducer(existingState, action);
    
    expect(state.users[0].name).toBe('Jane Doe');
  });
});
```

2. **Test Selectors:**
```javascript
// tests/selectors.test.js
import { selectFilteredUsers } from '../src/selectors/userSelectors';

describe('userSelectors', () => {
  const mockState = {
    users: {
      users: [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
      ],
      filters: { search: 'John' },
    },
  };

  it('should filter users by search term', () => {
    const filteredUsers = selectFilteredUsers(mockState);
    expect(filteredUsers).toHaveLength(1);
    expect(filteredUsers[0].name).toBe('John Doe');
  });
});
```

## Debugging Redux

### Redux DevTools

Enable Redux DevTools for debugging:

```javascript
// Store automatically includes DevTools in development
export const store = configureStore({
  reducer: {
    // ... reducers
  },
  // DevTools enabled by default in development
});
```

### Action Logging

Add logging middleware for debugging:

```javascript
const loggerMiddleware = (store) => (next) => (action) => {
  console.group(action.type);
  console.info('dispatching', action);
  const result = next(action);
  console.log('next state', store.getState());
  console.groupEnd();
  return result;
};

export const store = configureStore({
  reducer: {
    // ... reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
});
```

### State Inspection

Create debug components for state inspection:

```jsx
const ReduxDebugger = () => {
  const state = useSelector(state => state);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <details style={{ position: 'fixed', bottom: 0, right: 0, background: 'white', padding: '10px' }}>
      <summary>Redux State</summary>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </details>
  );
};
```

## Related Documentation

### Essential Reading
- **[Socket Integration Guide](SOCKET_INTEGRATION.md)** - Real-time socket integration patterns (see [Redux Integration](SOCKET_INTEGRATION.md#redux-integration))
- **[Form Integration Guide](FORM_INTEGRATION_GUIDE.md)** - Form state management patterns (see [Patient Data Integration](FORM_INTEGRATION_GUIDE.md#patient-data-integration))

### Complementary Guides
- **[AI Chatbot Guide](AI_CHATBOT_GUIDE.md)** - AI healthcare chatbot state management with Redux (see [Redux Integration](AI_CHATBOT_GUIDE.md#redux-integration))
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Redux configuration in production environments

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **Socket Integration** | [Integration Between Redux and Socket Events](#integration-between-redux-and-socket-events) | [Socket Integration Guide](SOCKET_INTEGRATION.md#redux-integration) |
| **Form State** | [State Management for Real-time Updates](#state-management-for-real-time-updates) | [Form Integration Guide](FORM_INTEGRATION_GUIDE.md#patient-data-integration) |
| **AI Chatbot State** | [Creating New Redux Slices](#creating-new-redux-slices-and-actions) | [AI Chatbot Guide](AI_CHATBOT_GUIDE.md#redux-integration) |
| **Production Setup** | [Best Practices](#best-practices) | [Deployment Guide](DEPLOYMENT_GUIDE.md#performance-optimization) |

---

This guide provides comprehensive coverage of Redux integration patterns in MobileUurka. For additional support or questions about state management, please refer to the Redux Toolkit documentation or create an issue in the project repository.