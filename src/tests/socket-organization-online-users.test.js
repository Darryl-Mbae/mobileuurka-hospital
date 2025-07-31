import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  setOnlineUsers,
  setOnlineUsersByOrganization,
  setAllOnlineUsersByOrganization,
  addOnlineUserToOrganization,
  removeOnlineUserFromOrganization,
  setOnlineCountsByOrganization,
  updateOnlineCountForOrganization,
  userWentOffline
} from '../reducers/Slices/userSlice.js';

describe('Organization-aware Online Users', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer,
      },
    });
  });

  it('should set online users by organization', () => {
    const organizationId = 'org1';
    const userIds = ['user1', 'user2', 'user3'];

    store.dispatch(setOnlineUsersByOrganization({ organizationId, userIds }));

    const state = store.getState();
    expect(state.user.onlineUsersByOrganization[organizationId]).toEqual(userIds);
  });

  it('should set all online users by organization', () => {
    const onlineUsersByOrg = {
      org1: ['user1', 'user2'],
      org2: ['user3', 'user4'],
    };

    store.dispatch(setAllOnlineUsersByOrganization(onlineUsersByOrg));

    const state = store.getState();
    expect(state.user.onlineUsersByOrganization).toEqual(onlineUsersByOrg);
  });

  it('should add online user to organization', () => {
    const organizationId = 'org1';
    const userId = 'user1';

    store.dispatch(addOnlineUserToOrganization({ organizationId, userId }));

    const state = store.getState();
    expect(state.user.onlineUsersByOrganization[organizationId]).toContain(userId);
  });
}); 
 it('should remove online user from organization', () => {
    const organizationId = 'org1';
    const userIds = ['user1', 'user2', 'user3'];
    
    // First set users
    store.dispatch(setOnlineUsersByOrganization({ organizationId, userIds }));
    
    // Then remove one user
    store.dispatch(removeOnlineUserFromOrganization({ organizationId, userId: 'user2' }));

    const state = store.getState();
    expect(state.user.onlineUsersByOrganization[organizationId]).toEqual(['user1', 'user3']);
    expect(state.user.onlineUsersByOrganization[organizationId]).not.toContain('user2');
  });

  it('should set online counts by organization', () => {
    const counts = {
      org1: 5,
      org2: 3,
      org3: 8,
    };

    store.dispatch(setOnlineCountsByOrganization(counts));

    const state = store.getState();
    expect(state.user.onlineCountsByOrganization).toEqual(counts);
  });

  it('should update online count for specific organization', () => {
    const organizationId = 'org1';
    const count = 10;

    store.dispatch(updateOnlineCountForOrganization({ organizationId, count }));

    const state = store.getState();
    expect(state.user.onlineCountsByOrganization[organizationId]).toBe(count);
  });

  it('should remove user from all organizations when user goes offline', () => {
    // Set up initial state with user in multiple organizations
    const onlineUsersByOrg = {
      org1: ['user1', 'user2', 'user3'],
      org2: ['user1', 'user4'],
      org3: ['user2', 'user5'],
    };
    
    store.dispatch(setAllOnlineUsersByOrganization(onlineUsersByOrg));
    store.dispatch(setOnlineUsers(['user1', 'user2', 'user3', 'user4', 'user5']));

    // User goes offline
    store.dispatch(userWentOffline({ userId: 'user1' }));

    const state = store.getState();
    
    // Check backward compatibility array
    expect(state.user.onlineUsers).not.toContain('user1');
    
    // Check organization-specific arrays
    expect(state.user.onlineUsersByOrganization.org1).not.toContain('user1');
    expect(state.user.onlineUsersByOrganization.org2).not.toContain('user1');
    expect(state.user.onlineUsersByOrganization.org3).toContain('user2'); // user2 should still be there
  });

  it('should not add duplicate users to organization online list', () => {
    const organizationId = 'org1';
    const userId = 'user1';

    // Add user twice
    store.dispatch(addOnlineUserToOrganization({ organizationId, userId }));
    store.dispatch(addOnlineUserToOrganization({ organizationId, userId }));

    const state = store.getState();
    expect(state.user.onlineUsersByOrganization[organizationId]).toEqual([userId]);
    expect(state.user.onlineUsersByOrganization[organizationId].length).toBe(1);
  });
