// Test file to verify organization filtering logic
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store
const mockStore = {
  getState: vi.fn(),
  dispatch: vi.fn()
};

// Mock the socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connected: true,
    connect: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Mock the store
vi.mock('../config/store.js', () => ({
  store: mockStore
}));

// Mock Redux slices
vi.mock('../reducers/Slices/socketSlice.js', () => ({
  setSocket: vi.fn(),
  setConnecting: vi.fn(),
  disconnectSocket: vi.fn(),
  resetSocket: vi.fn(),
  setConnectionError: vi.fn(),
  clearError: vi.fn(),
  setReconnectAttempts: vi.fn(),
  setConnectionHealth: vi.fn(),
  setReconnecting: vi.fn(),
}));

vi.mock('../reducers/Slices/userSlice.js', () => ({
  setOnlineUsers: vi.fn(),
  userWentOffline: vi.fn(),
  updateUser: vi.fn(),
  setUsers: vi.fn(),
  addUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../reducers/Slices/patientsSlice.js', () => ({
  updatePatient: vi.fn(),
  setPatients: vi.fn(),
  addPatient: vi.fn(),
  deletePatient: vi.fn(),
}));

vi.mock('../reducers/Slices/organizationSlice.js', () => ({
  updateOrganisation: vi.fn(),
  setOrganisations: vi.fn(),
  addOrganisation: vi.fn(),
  removeOrganisation: vi.fn(),
}));

vi.mock('../reducers/Slices/chatSlice.js', () => ({
  addChat: vi.fn(),
}));

describe('Socket Organization Filtering', () => {
  let SocketManager;
  let socketManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the SocketManager class
    const socketModule = await import('../config/socket.js');
    SocketManager = socketModule.default.constructor;
    socketManager = new SocketManager();
  });

  describe('getCurrentUserOrganizations', () => {
    it('should return empty array when no current user', () => {
      mockStore.getState.mockReturnValue({
        user: { currentUser: null },
        organisation: { organisations: [] }
      });

      const result = socketManager.getCurrentUserOrganizations();
      expect(result).toEqual([]);
    });

    it('should return organization IDs when user has organizationId', () => {
      mockStore.getState.mockReturnValue({
        user: { 
          currentUser: { id: 1, organizationId: 'org1' }
        },
        organisation: { 
          organisations: [
            { id: 'org1', name: 'Org 1' },
            { id: 'org2', name: 'Org 2' }
          ]
        }
      });

      const result = socketManager.getCurrentUserOrganizations();
      expect(result).toEqual(['org1']);
    });

    it('should return organization IDs when user is in organization members', () => {
      mockStore.getState.mockReturnValue({
        user: { 
          currentUser: { id: 1 }
        },
        organisation: { 
          organisations: [
            { id: 'org1', name: 'Org 1', members: [{ id: 1 }] },
            { id: 'org2', name: 'Org 2', members: [{ id: 2 }] }
          ]
        }
      });

      const result = socketManager.getCurrentUserOrganizations();
      expect(result).toEqual(['org1']);
    });
  });

  describe('shouldProcessEvent', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        user: { 
          currentUser: { id: 1, organizationId: 'org1' }
        },
        organisation: { 
          organisations: [
            { id: 'org1', name: 'Org 1' }
          ]
        }
      });
    });

    it('should allow events with matching organizationId', () => {
      const result = socketManager.shouldProcessEvent({ organizationId: 'org1' });
      expect(result).toBe(true);
    });

    it('should filter events with non-matching organizationId', () => {
      const result = socketManager.shouldProcessEvent({ organizationId: 'org2' });
      expect(result).toBe(false);
    });

    it('should allow events without organization context', () => {
      const result = socketManager.shouldProcessEvent({ someData: 'test' });
      expect(result).toBe(true);
    });

    it('should filter user events from different organizations', () => {
      const result = socketManager.shouldProcessEvent({ 
        user: { id: 2, organizationId: 'org2' }
      });
      expect(result).toBe(false);
    });

    it('should allow user events from same organization', () => {
      const result = socketManager.shouldProcessEvent({ 
        user: { id: 2, organizationId: 'org1' }
      });
      expect(result).toBe(true);
    });
  });

  describe('filterOnlineUsersByOrganization', () => {
    beforeEach(() => {
      mockStore.getState.mockReturnValue({
        user: { 
          currentUser: { id: 1, organizationId: 'org1' },
          users: [
            { id: 1, organizationId: 'org1' },
            { id: 2, organizationId: 'org1' },
            { id: 3, organizationId: 'org2' }
          ]
        },
        organisation: { 
          organisations: [
            { id: 'org1', name: 'Org 1' }
          ]
        }
      });
    });

    it('should filter online users to only include same organization', () => {
      const onlineUsers = [1, 2, 3];
      const result = socketManager.filterOnlineUsersByOrganization(onlineUsers);
      expect(result).toEqual([1, 2]);
    });

    it('should return empty array when no users match organization', () => {
      const onlineUsers = [3];
      const result = socketManager.filterOnlineUsersByOrganization(onlineUsers);
      expect(result).toEqual([]);
    });
  });
});