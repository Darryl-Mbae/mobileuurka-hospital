import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import socketSlice from '../reducers/Slices/socketSlice.js';
import userSlice from '../reducers/Slices/userSlice.js';
import patientsSlice from '../reducers/Slices/patientsSlice.js';
import organizationSlice from '../reducers/Slices/organizationSlice.js';
import chatSlice from '../reducers/Slices/chatSlice.js';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));

// Import socketManager instance after mocking
import socketManager from '../config/socket.js';

describe('Socket Medical Record Event Handling', () => {
  let store;
  let mockSocket;

  beforeEach(() => {
    // Create a test store
    store = configureStore({
      reducer: {
        socket: socketSlice,
        user: userSlice,
        patient: patientsSlice,
        organisation: organizationSlice,
        chat: chatSlice,
      },
      preloadedState: {
        user: {
          currentUser: { id: 1, organizationId: 'org1' },
          users: [
            { id: 1, organizationId: 'org1', name: 'Test User' },
            { id: 2, organizationId: 'org2', name: 'Other User' },
          ],
        },
        patient: {
          patients: [
            {
              id: 'patient1',
              name: 'Test Patient',
              organizationId: 'org1',
              triages: [],
              labworks: [],
              currentPregnancies: [],
              infections: [],
              fetalInfos: [],
            },
          ],
          selectedPatient: null,
        },
        organisation: {
          organisations: [
            { id: 'org1', name: 'Test Org', members: [{ id: 1 }] },
            { id: 'org2', name: 'Other Org', members: [{ id: 2 }] },
          ],
        },
      },
    });

    // Mock the store in the socket manager
    vi.doMock('../config/store.js', () => ({
      store,
    }));

    // Use the imported socket manager instance
    
    // Mock socket
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
    };
    
    socketManager.socket = mockSocket;
  });

  describe('handleMedicalRecordEvent', () => {
    it('should update patient when full patient data is provided', () => {
      const eventData = {
        patient: {
          id: 'patient1',
          name: 'Test Patient Updated',
          organizationId: 'org1',
          triages: [{ id: 'triage1', data: 'test' }],
        },
        patientId: 'patient1',
      };

      socketManager.handleMedicalRecordEvent(eventData, 'created');

      const state = store.getState();
      const updatedPatient = state.patient.patients.find(p => p.id === 'patient1');
      expect(updatedPatient.name).toBe('Test Patient Updated');
      expect(updatedPatient.triages).toHaveLength(1);
    });

    it('should update specific medical record when only record data is provided', () => {
      const eventData = {
        patientId: 'patient1',
        medicalRecord: {
          id: 'triage1',
          type: 'triage',
          data: 'test triage data',
        },
        recordType: 'triage',
      };

      socketManager.handleMedicalRecordEvent(eventData, 'created');

      const state = store.getState();
      const updatedPatient = state.patient.patients.find(p => p.id === 'patient1');
      expect(updatedPatient.triages).toHaveLength(1);
      expect(updatedPatient.triages[0].id).toBe('triage1');
      expect(updatedPatient.triages[0].data).toBe('test triage data');
    });

    it('should update existing medical record when event type is updated', () => {
      // First, add a medical record
      const createEventData = {
        patientId: 'patient1',
        medicalRecord: {
          id: 'labwork1',
          type: 'labwork',
          result: 'initial result',
        },
        recordType: 'labwork',
      };

      socketManager.handleMedicalRecordEvent(createEventData, 'created');

      // Then update it
      const updateEventData = {
        patientId: 'patient1',
        medicalRecord: {
          id: 'labwork1',
          type: 'labwork',
          result: 'updated result',
        },
        recordType: 'labwork',
      };

      socketManager.handleMedicalRecordEvent(updateEventData, 'updated');

      const state = store.getState();
      const updatedPatient = state.patient.patients.find(p => p.id === 'patient1');
      expect(updatedPatient.labworks).toHaveLength(1);
      expect(updatedPatient.labworks[0].result).toBe('updated result');
    });

    it('should handle different medical record types correctly', () => {
      const recordTypes = [
        { type: 'triage', arrayName: 'triages' },
        { type: 'labwork', arrayName: 'labworks' },
        { type: 'pregnancy', arrayName: 'currentPregnancies' },
        { type: 'infection', arrayName: 'infections' },
        { type: 'fetal', arrayName: 'fetalInfos' },
      ];

      recordTypes.forEach((recordType, index) => {
        const eventData = {
          patientId: 'patient1',
          medicalRecord: {
            id: `record${index}`,
            type: recordType.type,
            data: `test ${recordType.type} data`,
          },
          recordType: recordType.type,
        };

        socketManager.handleMedicalRecordEvent(eventData, 'created');
      });

      const state = store.getState();
      const updatedPatient = state.patient.patients.find(p => p.id === 'patient1');

      recordTypes.forEach((recordType, index) => {
        expect(updatedPatient[recordType.arrayName]).toHaveLength(1);
        expect(updatedPatient[recordType.arrayName][0].id).toBe(`record${index}`);
      });
    });

    it('should not update patient if patient not found in state', () => {
      const eventData = {
        patientId: 'nonexistent-patient',
        medicalRecord: {
          id: 'record1',
          type: 'triage',
          data: 'test data',
        },
        recordType: 'triage',
      };

      // Should not throw error
      expect(() => {
        socketManager.handleMedicalRecordEvent(eventData, 'created');
      }).not.toThrow();

      const state = store.getState();
      // Original patient should be unchanged
      const originalPatient = state.patient.patients.find(p => p.id === 'patient1');
      expect(originalPatient.triages).toHaveLength(0);
    });

    it('should update lastUpdated timestamp when medical record is added', () => {
      const eventData = {
        patientId: 'patient1',
        medicalRecord: {
          id: 'record1',
          type: 'triage',
          data: 'test data',
        },
        recordType: 'triage',
      };

      const beforeTime = new Date().toISOString();
      socketManager.handleMedicalRecordEvent(eventData, 'created');
      const afterTime = new Date().toISOString();

      const state = store.getState();
      const updatedPatient = state.patient.patients.find(p => p.id === 'patient1');
      
      expect(updatedPatient.lastUpdated).toBeDefined();
      expect(updatedPatient.lastUpdated >= beforeTime).toBe(true);
      expect(updatedPatient.lastUpdated <= afterTime).toBe(true);
    });
  });

  describe('organization filtering for medical records', () => {
    it('should process medical record events for patients in same organization', () => {
      const eventData = {
        patientId: 'patient1',
        organizationId: 'org1',
        medicalRecord: {
          id: 'record1',
          type: 'triage',
          data: 'test data',
        },
      };

      const shouldProcess = socketManager.shouldProcessEvent(eventData);
      expect(shouldProcess).toBe(true);
    });

    it('should filter out medical record events for patients in different organizations', () => {
      const eventData = {
        patientId: 'patient2',
        organizationId: 'org2',
        medicalRecord: {
          id: 'record1',
          type: 'triage',
          data: 'test data',
        },
      };

      const shouldProcess = socketManager.shouldProcessEvent(eventData);
      expect(shouldProcess).toBe(false);
    });
  });
});