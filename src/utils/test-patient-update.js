/**
 * Test script to verify patient update event handling
 * This simulates the exact event structure you showed in your message
 */

// Simulate the event data structure you received
const testPatientUpdateEvent = {
  broadcastId: "1753952804873-7p7k1j2pw",
  changes: { address: 'Kitengela' },
  organizationId: "cmdot6a250002viu6cib6msah",
  patient: {
    id: 'cmdoto7xr0008viu6pajez6ln',
    patientId: '38932130',
    name: 'Audrey Nyambura',
    firstName: 'Audrey',
    lastName: 'Nyambura',
    address: 'Kitengela', // Updated field
    organizationId: "cmdot6a250002viu6cib6msah",
    // ... other patient fields
  },
  patientId: "cmdoto7xr0008viu6pajez6ln",
  sourceUserId: "cmdot6a1t0000viu6arpmkdh0",
  timestamp: "2025-07-31T09:06:44.873"
};

/**
 * Function to test the patient update event processing
 */
export const testPatientUpdateProcessing = (socketManager, store) => {
  console.log('=== Testing Patient Update Event Processing ===');
  
  // Log the original event structure
  console.log('\n1. Original event received:');
  console.log(JSON.stringify(testPatientUpdateEvent, null, 2));
  
  // Test the data extraction logic
  console.log('\n2. Testing data extraction:');
  const patientData = testPatientUpdateEvent.patient || testPatientUpdateEvent;
  console.log('Extracted patient data:', {
    id: patientData.id,
    name: patientData.name,
    address: patientData.address,
    organizationId: patientData.organizationId
  });
  
  // Test organization filtering context
  console.log('\n3. Testing organization filtering context:');
  const filteringContext = {
    organizationId: testPatientUpdateEvent.organizationId || patientData.organizationId,
    patient: patientData
  };
  console.log('Filtering context:', filteringContext);
  
  // Test the shouldProcessEvent logic
  console.log('\n4. Testing organization filtering:');
  if (socketManager && typeof socketManager.shouldProcessEvent === 'function') {
    const shouldProcess = socketManager.shouldProcessEvent(filteringContext);
    console.log('Should process event:', shouldProcess);
  } else {
    console.log('Socket manager not available for testing');
  }
  
  // Test Redux store update
  console.log('\n5. Testing Redux store update:');
  if (store) {
    const currentState = store.getState();
    console.log('Current patients in store:', currentState.patient?.patients?.length || 0);
    
    // Find the specific patient
    const existingPatient = currentState.patient?.patients?.find(p => p.id === patientData.id);
    if (existingPatient) {
      console.log('Patient found in store:', {
        id: existingPatient.id,
        name: existingPatient.name,
        currentAddress: existingPatient.address
      });
      console.log('Address should update from:', existingPatient.address, 'to:', patientData.address);
    } else {
      console.log('Patient not found in store - would be added as new patient');
    }
  } else {
    console.log('Store not available for testing');
  }
  
  console.log('\n=== Test Complete ===');
};

/**
 * Expected behavior after the fix:
 * 1. Event is received with nested patient data
 * 2. Patient data is correctly extracted from event.patient
 * 3. Organization filtering uses event.organizationId
 * 4. Redux store is updated with the patient data
 * 5. UI components re-render with updated patient information
 */
export const expectedBehavior = {
  dataExtraction: 'event.patient || event should extract correct patient data',
  organizationFiltering: 'event.organizationId should be used for filtering',
  reduxUpdate: 'updatePatient action should be dispatched with extracted patient data',
  uiUpdate: 'Patient components should re-render with updated data'
};

/**
 * Debug function to log the current socket event handlers
 */
export const debugSocketHandlers = (socketManager) => {
  console.log('=== Socket Event Handlers Debug ===');
  
  if (socketManager && socketManager.socket) {
    console.log('Socket connected:', socketManager.socket.connected);
    console.log('Socket ID:', socketManager.socket.id);
    
    // Check if patient_updated handler is registered
    const eventNames = socketManager.socket.eventNames ? socketManager.socket.eventNames() : [];
    console.log('Registered event handlers:', eventNames);
    
    if (eventNames.includes('patient_updated')) {
      console.log('✅ patient_updated handler is registered');
    } else {
      console.log('❌ patient_updated handler is NOT registered');
    }
  } else {
    console.log('Socket manager or socket not available');
  }
};

export default {
  testPatientUpdateEvent,
  testPatientUpdateProcessing,
  expectedBehavior,
  debugSocketHandlers
};