/**
 * Debug script for patient update events
 * Run this in your browser console to test patient update handling
 */

// Function to manually trigger a patient update event for testing
window.debugPatientUpdate = function() {
  console.log('🔍 Debugging Patient Update Event Handling');
  
  // Get the socket manager instance
  const socketManager = window.socketManager; // You might need to expose this globally
  
  if (!socketManager) {
    console.error('❌ Socket manager not found. Make sure it\'s exposed globally.');
    return;
  }
  
  // Test event data (based on your actual event)
  const testEvent = {
    broadcastId: "test-broadcast-123",
    changes: { address: 'Test Address Update' },
    organizationId: "test-org-123",
    patient: {
      id: 'test-patient-123',
      patientId: '12345',
      name: 'Test Patient',
      firstName: 'Test',
      lastName: 'Patient',
      address: 'Test Address Update',
      organizationId: "test-org-123",
    },
    patientId: "test-patient-123",
    sourceUserId: "test-user-123",
    timestamp: new Date().toISOString()
  };
  
  console.log('📤 Simulating patient_updated event:', testEvent);
  
  // Manually trigger the event handler
  if (socketManager.socket && socketManager.socket.emit) {
    // Emit the event to test the handler
    socketManager.socket.emit('patient_updated', testEvent);
    console.log('✅ Event emitted successfully');
  } else {
    console.error('❌ Socket not available for testing');
  }
};

// Function to check current Redux state
window.debugPatientState = function() {
  console.log('🔍 Debugging Patient Redux State');
  
  // Try to get the store (you might need to expose this globally)
  const store = window.store || window.__REDUX_STORE__;
  
  if (!store) {
    console.error('❌ Redux store not found. Make sure it\'s exposed globally.');
    return;
  }
  
  const state = store.getState();
  console.log('📊 Current Redux State:');
  console.log('- Patients count:', state.patient?.patients?.length || 0);
  console.log('- Selected patient:', state.patient?.selectedPatient?.id || 'none');
  console.log('- Current user org:', state.user?.currentUser?.organizationId || 'none');
  
  if (state.patient?.patients?.length > 0) {
    console.log('- First few patients:', state.patient.patients.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      organizationId: p.organizationId
    })));
  }
};

// Function to check socket connection status
window.debugSocketConnection = function() {
  console.log('🔍 Debugging Socket Connection');
  
  const socketManager = window.socketManager;
  
  if (!socketManager) {
    console.error('❌ Socket manager not found');
    return;
  }
  
  if (socketManager.socket) {
    console.log('✅ Socket exists');
    console.log('- Connected:', socketManager.socket.connected);
    console.log('- Socket ID:', socketManager.socket.id);
    
    // Check event listeners
    const eventNames = socketManager.socket.eventNames ? socketManager.socket.eventNames() : [];
    console.log('- Registered events:', eventNames.length);
    
    if (eventNames.includes('patient_updated')) {
      console.log('✅ patient_updated handler registered');
    } else {
      console.log('❌ patient_updated handler NOT registered');
    }
  } else {
    console.log('❌ Socket not initialized');
  }
};

// Instructions for use
console.log(`
🛠️  Patient Update Debug Tools Loaded!

Available functions:
- debugPatientUpdate()     - Test patient update event handling
- debugPatientState()      - Check current Redux state
- debugSocketConnection()  - Check socket connection status

Usage:
1. Open browser console
2. Run: debugSocketConnection()
3. Run: debugPatientState()
4. Run: debugPatientUpdate()

Note: You may need to expose socketManager and store globally:
window.socketManager = socketManager;
window.store = store;
`);

export default {
  debugPatientUpdate: window.debugPatientUpdate,
  debugPatientState: window.debugPatientState,
  debugSocketConnection: window.debugSocketConnection
};