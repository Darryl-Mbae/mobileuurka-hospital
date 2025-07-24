# Design Document

## Overview

Your backend socket handler is already enhanced and working. The frontend just needs to be updated to handle all the new events and features properly. This is about updating your existing `src/config/socket.js` and `src/hooks/useSocket.js` to work with your enhanced backend.

## What Needs to Change

### Current Frontend Issues
Looking at your current frontend socket code, it needs updates to handle:

1. **New Event Types**: Your backend sends many events your frontend doesn't handle yet
2. **Organization Filtering**: Your backend filters by organization, frontend should respect this
3. **Better Reconnection**: Your current reconnection is basic, can be improved
4. **Online Users**: Your backend has sophisticated online user tracking, frontend should use it
5. **Error Handling**: Better error handling for the new backend responses

### Simple Architecture

```
Your Enhanced Backend Socket Handler
                ↓
        Frontend Socket Manager (update existing)
                ↓
        Redux Store (update existing slices)
                ↓
        React Components (update to use new events)
```

## What We'll Update

### 1. Update `src/config/socket.js`

**Add Missing Event Handlers:**
Your backend sends these events that your frontend doesn't handle:
- `online_count_updated` - Organization-specific online counts
- `get_online_users_response` - Response to online user requests
- `get_online_counts_response` - Response to online count requests
- All the new medical record events
- All the new feedback events

**Improve Reconnection:**
- Add exponential backoff (wait longer between retries)
- Better error handling
- Show connection status to user

**Add Organization Awareness:**
- Filter events based on user's organizations
- Handle organization-specific online users

### 2. Update `src/hooks/useSocket.js`

**Add New Methods:**
Your backend supports these but your hook doesn't expose them:
- Request online users for organizations
- Request online counts for organizations
- Handle medical record events properly
- Handle feedback events properly

**Improve Connection Management:**
- Better connection status tracking
- Automatic reconnection handling
- Error state management

### 3. Update Redux Slices

**Enhance `socketSlice.js`:**
- Add connection health tracking
- Add reconnection attempt counting
- Better error state management

**Update Other Slices:**
- Handle new event types in existing slices
- Add organization filtering where needed

### 4. Add New React Hooks (Optional)

**`useOnlineUsers` Hook:**
- Get online users for current user's organizations
- Real-time updates when users come online/offline

**`useSocketHealth` Hook:**
- Monitor connection health
- Show connection status to users

## Key Backend Events to Handle

Based on your backend code, these are the main events your frontend should handle:

### Organization Events
- `organization_updated`
- `organization_created` 
- `organization_deleted`
- `organizations_updated`

### User Management Events
- `user_added_to_organization`
- `user_created_for_organization`
- `user_removed_from_organization`
- `user_role_updated`

### Patient Events
- `patient_created`
- `patient_updated`
- `patient_deleted`
- `patients_updated`

### Medical Record Events
- `medical_record_created`
- `medical_record_updated`

### Online Presence Events
- `user_online`
- `user_offline`
- `online_users_updated`
- `online_count_updated`

### Feedback Events
- `feedback_created`
- `feedback_status_updated`

### Request-Response Events
- `get_online_users_response`
- `get_online_counts_response`

## Implementation Approach

### Phase 1: Fix Basic Connection
1. Update socket.js to handle reconnection better
2. Add missing event listeners
3. Improve error handling

### Phase 2: Add Organization Awareness
1. Filter events by user's organizations
2. Update online user handling
3. Add organization-specific features

### Phase 3: Add New Features
1. Handle medical record events
2. Handle feedback events
3. Add new React hooks if needed

### Phase 4: Polish
1. Add better error messages
2. Add connection status indicators
3. Test everything works

## Simple Changes Needed

### In `socket.js`:
- Add listeners for all the new events from your backend
- Improve the reconnection logic
- Add organization filtering

### In `useSocket.js`:
- Add methods to request online users/counts
- Add methods for medical records and feedback
- Improve connection status handling

### In Redux slices:
- Handle the new events properly
- Add organization filtering where needed

This is much simpler than building everything from scratch - we're just updating your existing code to work with your enhanced backend!