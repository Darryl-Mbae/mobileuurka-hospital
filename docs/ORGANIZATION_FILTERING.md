# Organization Filtering in Socket Events

## Overview

The socket system now includes organization-aware filtering to ensure users only receive real-time updates for data they should have access to based on their organization memberships.

## How It Works

### User Organization Detection

The system determines a user's organization memberships by checking:

1. **Direct Organization ID**: `currentUser.organizationId`
2. **Organization Members**: Organizations where the user appears in `org.members` array
3. **Organization Users**: Organizations where the user appears in `org.users` array  
4. **Organization Member IDs**: Organizations where the user ID appears in `org.memberIds` array

### Event Filtering

All incoming socket events are filtered based on organization context:

#### Events with Organization Context
- Events with `organizationId` field
- Events with `organizationIds` array
- Events with user data containing organization info
- Events with patient data containing organization info

#### Filtering Logic
- Users only receive events from organizations they belong to
- Events without organization context are allowed (system-wide events)
- Online users lists are filtered to show only users from shared organizations

## Filtered Event Types

### User Events
- `user_updated` - Only for users in shared organizations
- `user_created` - Only for users in shared organizations  
- `user_deleted` - Only for users in shared organizations
- `users_updated` - Filtered list of users from shared organizations

### Patient Events
- `patient_created` - Only for patients in accessible organizations
- `patient_updated` - Only for patients in accessible organizations
- `patient_deleted` - Only for patients in accessible organizations
- `patients_updated` - Filtered list of patients from accessible organizations

### Organization Events
- `organization_created` - Only for accessible organizations
- `organization_updated` - Only for accessible organizations
- `organization_deleted` - Only for accessible organizations
- `organizations_updated` - Filtered list of accessible organizations

### Organization Member Events
- `user_added_to_organization` - Only for accessible organizations
- `user_created_for_organization` - Only for accessible organizations
- `user_removed_from_organization` - Only for accessible organizations
- `user_role_updated` - Only for accessible organizations

### Medical Record Events
- `medical_record_created` - Only for records in accessible organizations
- `medical_record_updated` - Only for records in accessible organizations

### Feedback Events
- `feedback_created` - Only for feedback in accessible organizations
- `feedback_status_updated` - Only for feedback in accessible organizations

### Online Presence Events
- `online_users_updated` - Filtered to show only users from shared organizations
- `user_online` - Only for users in shared organizations
- `user_offline` - Processed for all users (to maintain accurate online lists)
- `online_count_updated` - Only for accessible organizations
- `get_online_users_response` - Filtered to show only users from shared organizations
- `get_online_counts_response` - Filtered to show only counts for accessible organizations

## New Methods

### SocketManager Methods
- `getCurrentUserOrganizations()` - Get current user's organization IDs
- `shouldProcessEvent(eventData)` - Check if event should be processed
- `filterOnlineUsersByOrganization(onlineUsers)` - Filter online users by organization
- `getOrganizationFilteredOnlineUsers()` - Get filtered online users
- `getUserOrganizations()` - Public method to get user organizations

### useSocket Hook Methods
- `getOrganizationFilteredOnlineUsers()` - Get organization-filtered online users
- `getUserOrganizations()` - Get current user's organization IDs

## Usage Examples

```javascript
import { useSocket } from '../hooks/useSocket';

function MyComponent() {
  const { 
    getOrganizationFilteredOnlineUsers,
    getUserOrganizations 
  } = useSocket();
  
  // Get online users from shared organizations only
  const onlineUsers = getOrganizationFilteredOnlineUsers();
  
  // Get current user's organization IDs
  const userOrgs = getUserOrganizations();
  
  return (
    <div>
      <p>Online users in your organizations: {onlineUsers.length}</p>
      <p>Your organizations: {userOrgs.join(', ')}</p>
    </div>
  );
}
```

## Security Benefits

1. **Data Isolation**: Users only see data from their organizations
2. **Privacy Protection**: Prevents cross-organization data leakage
3. **Scalability**: Reduces unnecessary event processing
4. **Compliance**: Helps meet data access control requirements

## Fallback Behavior

- Users with no organization memberships see all events (admin fallback)
- Events without organization context are allowed through
- System maintains backward compatibility with existing event structures