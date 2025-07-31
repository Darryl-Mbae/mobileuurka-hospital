/**
 * Test script for the actual medical record event structure you received
 */

// Your actual event structure
const realMedicalRecordEvent = {
  broadcastId: "1753954443656-a85xdtar6",
  changes: { maleAge: 32 },
  modelName: "patienthistory",
  organizationId: "cmdr6q4o20002vi8xbelvhp06",
  patientId: "cmdr6tdxc000bvi8x2f2tm35u",
  record: {
    id: 'cmdr72wtn0001vijkf25bqkga',
    patientId: 'cmdr6tdxc000bvi8x2f2tm35u',
    editor: 'darrylmbae@mobileuurka.com',
    date: '2025-07-31',
    updatedAt: '2025-07-31T09:34:03.641Z',
    maleAge: 32, // This is the updated field
    // ... other fields
  },
  recordType: "patienthistory",
  sourceUserId: "cmdr6q4nz0000vi8xlkoqnctb",
  timestamp: "2025-07-31T09:34:03.656Z"
};

/**
 * Test the medical record event processing with the real event structure
 */
export const testRealMedicalRecordEvent = () => {
  console.log('=== Testing Real Medical Record Event ===');
  
  console.log('\n1. Event structure analysis:');
  console.log('- Has patient property:', !!realMedicalRecordEvent.patient);
  console.log('- Has record property:', !!realMedicalRecordEvent.record);
  console.log('- Has medicalRecord property:', !!realMedicalRecordEvent.medicalRecord);
  console.log('- Record type:', realMedicalRecordEvent.recordType);
  console.log('- Model name:', realMedicalRecordEvent.modelName);
  console.log('- Patient ID:', realMedicalRecordEvent.patientId);
  console.log('- Organization ID:', realMedicalRecordEvent.organizationId);
  
  console.log('\n2. Data extraction logic:');
  const medicalRecordData = realMedicalRecordEvent.medicalRecord || realMedicalRecordEvent.record;
  const recordType = realMedicalRecordEvent.recordType || realMedicalRecordEvent.modelName || medicalRecordData?.type;
  
  console.log('- Extracted medical record data:', !!medicalRecordData);
  console.log('- Extracted record type:', recordType);
  console.log('- Record ID:', medicalRecordData?.id);
  console.log('- Updated field (maleAge):', medicalRecordData?.maleAge);
  
  console.log('\n3. Record type mapping:');
  let mappedRecordType = recordType;
  switch (recordType) {
    case 'patienthistory':
      mappedRecordType = 'patientHistories';
      break;
    case 'triage':
      mappedRecordType = 'triage';
      break;
    case 'labwork':
      mappedRecordType = 'labwork';
      break;
    case 'pregnancy':
    case 'currentPregnancy':
      mappedRecordType = 'pregnancy';
      break;
    case 'infection':
      mappedRecordType = 'infection';
      break;
    case 'fetal':
    case 'fetalInfo':
      mappedRecordType = 'fetal';
      break;
  }
  console.log('- Original type:', recordType);
  console.log('- Mapped type:', mappedRecordType);
  
  console.log('\n4. Expected Redux action:');
  const expectedAction = {
    type: 'patient/updatePatientMedicalRecord',
    payload: {
      patientId: realMedicalRecordEvent.patientId,
      recordType: mappedRecordType,
      recordData: medicalRecordData,
      eventType: 'updated'
    }
  };
  console.log('- Action:', expectedAction);
  
  console.log('\n5. Expected patient state update:');
  console.log('- Patient array to update: patient.patientHistories');
  console.log('- Record to find by ID:', medicalRecordData?.id);
  console.log('- Field to update: maleAge =', medicalRecordData?.maleAge);
  
  return {
    eventData: realMedicalRecordEvent,
    extractedData: medicalRecordData,
    recordType: mappedRecordType,
    expectedAction
  };
};

/**
 * Simulate the fixed event processing
 */
export const simulateFixedEventProcessing = () => {
  console.log('\n=== Simulating Fixed Event Processing ===');
  
  const eventData = realMedicalRecordEvent;
  
  // Step 1: Check for patient data (should be false)
  const patientData = eventData.patient;
  console.log('1. Patient data found:', !!patientData);
  
  // Step 2: Check for patientId (should be true)
  console.log('2. Patient ID found:', !!eventData.patientId);
  
  // Step 3: Extract medical record data
  const medicalRecordData = eventData.medicalRecord || eventData.record;
  const recordType = eventData.recordType || eventData.modelName || medicalRecordData?.type;
  
  console.log('3. Medical record data extracted:', !!medicalRecordData);
  console.log('4. Record type determined:', recordType);
  
  // Step 4: Map record type
  let mappedRecordType = recordType;
  switch (recordType) {
    case 'patienthistory':
      mappedRecordType = 'patientHistories';
      break;
  }
  
  console.log('5. Record type mapped:', mappedRecordType);
  
  // Step 5: Simulate Redux dispatch
  if (medicalRecordData && recordType) {
    console.log('6. ✅ Would dispatch updatePatientMedicalRecord action');
    console.log('   - Patient ID:', eventData.patientId);
    console.log('   - Record Type:', mappedRecordType);
    console.log('   - Event Type: updated');
    console.log('   - Record Data Keys:', Object.keys(medicalRecordData));
  } else {
    console.log('6. ❌ Would only update timestamp');
  }
  
  // Step 6: Expected UI update
  console.log('7. Expected UI behavior:');
  console.log('   - Patient component should re-render');
  console.log('   - patientHistories array should be updated');
  console.log('   - maleAge field should show new value: 32');
  console.log('   - lastUpdated timestamp should be updated');
};

/**
 * Debug function to check if the fix is working
 */
export const debugMedicalRecordFix = () => {
  console.log('=== Medical Record Fix Debug ===');
  
  console.log('\n✅ Fixed Issues:');
  console.log('1. Event handler now checks eventData.record (not just eventData.medicalRecord)');
  console.log('2. Record type mapping includes patienthistory -> patientHistories');
  console.log('3. Patient component now uses Redux state instead of local state');
  console.log('4. Redux action updatePatientMedicalRecord handles patientHistories');
  
  console.log('\n🔍 What should happen now:');
  console.log('1. medical_record_updated event received');
  console.log('2. handleMedicalRecordEvent extracts data from eventData.record');
  console.log('3. recordType "patienthistory" maps to "patientHistories"');
  console.log('4. updatePatientMedicalRecord action dispatched');
  console.log('5. Patient Redux state updated');
  console.log('6. Patient component re-renders with new data');
  
  console.log('\n🚨 If still not working, check:');
  console.log('1. Is patient in Redux store? (Patient component should load it)');
  console.log('2. Is socket connected and receiving events?');
  console.log('3. Is organization filtering allowing the event?');
  console.log('4. Are there any console errors?');
};

export default {
  realMedicalRecordEvent,
  testRealMedicalRecordEvent,
  simulateFixedEventProcessing,
  debugMedicalRecordFix
};