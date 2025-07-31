/**
 * Medical Record Event Handling Demo
 * 
 * This file demonstrates how the enhanced socket system handles medical record events.
 * It shows the integration between socket events and Redux state management.
 */

import { useSocket } from '../hooks/useSocket.js';

/**
 * Demo function showing how to emit medical record events
 */
export const demonstrateMedicalRecordEvents = () => {
  const socket = useSocket();

  // Example: Emit a medical record created event
  const handleMedicalRecordCreated = (patientId, recordData) => {
    const medicalRecordData = {
      patientId: patientId,
      medicalRecord: recordData,
      recordType: recordData.type,
      organizationId: recordData.organizationId,
      timestamp: new Date().toISOString(),
    };

    console.log('Emitting medical record created event:', medicalRecordData);
    socket.emitMedicalRecordCreated(medicalRecordData);
  };

  // Example: Emit a medical record updated event
  const handleMedicalRecordUpdated = (patientId, recordData) => {
    const medicalRecordData = {
      patientId: patientId,
      medicalRecord: recordData,
      recordType: recordData.type,
      organizationId: recordData.organizationId,
      timestamp: new Date().toISOString(),
    };

    console.log('Emitting medical record updated event:', medicalRecordData);
    socket.emitMedicalRecordUpdated(medicalRecordData);
  };

  return {
    handleMedicalRecordCreated,
    handleMedicalRecordUpdated,
  };
};

/**
 * Example medical record data structures
 */
export const exampleMedicalRecords = {
  triage: {
    id: 'triage_001',
    type: 'triage',
    patientId: 'patient_123',
    organizationId: 'org_456',
    data: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      weight: 150,
      symptoms: ['headache', 'fatigue'],
      priority: 'medium',
    },
    createdBy: 'nurse_001',
    createdAt: new Date().toISOString(),
  },

  labwork: {
    id: 'lab_001',
    type: 'labwork',
    patientId: 'patient_123',
    organizationId: 'org_456',
    data: {
      testType: 'blood_panel',
      results: {
        hemoglobin: 12.5,
        whiteBloodCells: 7000,
        platelets: 250000,
      },
      diagnosis: 'Normal blood work',
      notes: 'All values within normal range',
    },
    createdBy: 'lab_tech_001',
    createdAt: new Date().toISOString(),
  },

  pregnancy: {
    id: 'pregnancy_001',
    type: 'pregnancy',
    patientId: 'patient_123',
    organizationId: 'org_456',
    data: {
      gestationalAge: 20,
      estimatedDueDate: '2024-08-15',
      riskLevel: 'low',
      complications: [],
      notes: 'Pregnancy progressing normally',
    },
    createdBy: 'doctor_001',
    createdAt: new Date().toISOString(),
  },

  infection: {
    id: 'infection_001',
    type: 'infection',
    patientId: 'patient_123',
    organizationId: 'org_456',
    data: {
      hiv: 'Negative',
      syphilis: 'Negative',
      hepB: 'Negative',
      hepC: 'Negative',
      rubella: 'Immune',
      testDate: new Date().toISOString(),
    },
    createdBy: 'lab_tech_001',
    createdAt: new Date().toISOString(),
  },

  fetal: {
    id: 'fetal_001',
    type: 'fetal',
    patientId: 'patient_123',
    organizationId: 'org_456',
    data: {
      heartRate: 140,
      movement: 'active',
      position: 'vertex',
      estimatedWeight: 1200,
      abnormalities: [],
    },
    createdBy: 'sonographer_001',
    createdAt: new Date().toISOString(),
  },
};

/**
 * Function to simulate receiving medical record events
 * This would typically be called by the socket event handlers
 */
export const simulateMedicalRecordEvents = () => {
  console.log('=== Medical Record Event Handling Demo ===');
  
  console.log('\n1. Medical Record Created Events:');
  Object.entries(exampleMedicalRecords).forEach(([type, record]) => {
    console.log(`   - ${type.toUpperCase()} record created for patient ${record.patientId}`);
    console.log(`     Record ID: ${record.id}`);
    console.log(`     Organization: ${record.organizationId}`);
    console.log(`     Created by: ${record.createdBy}`);
  });

  console.log('\n2. How the socket system processes these events:');
  console.log('   - Events are filtered by organization membership');
  console.log('   - Patient data is updated in Redux store');
  console.log('   - UI components automatically re-render with new data');
  console.log('   - Medical records are organized by type (triages, labworks, etc.)');

  console.log('\n3. Organization filtering ensures:');
  console.log('   - Users only see medical records from their organizations');
  console.log('   - Patient privacy is maintained across organizations');
  console.log('   - Real-time updates are properly scoped');

  console.log('\n4. Redux integration provides:');
  console.log('   - Centralized state management for medical records');
  console.log('   - Automatic UI updates when records change');
  console.log('   - Consistent data structure across components');
};

/**
 * Usage example for React components
 */
export const MedicalRecordEventExample = `
// In a React component:
import { useSocket } from '../hooks/useSocket';
import { useSelector } from 'react-redux';

const PatientMedicalRecords = ({ patientId }) => {
  const socket = useSocket();
  const patient = useSelector(state => 
    state.patient.patients.find(p => p.id === patientId)
  );

  // Emit a new medical record
  const handleAddTriageRecord = (triageData) => {
    socket.emitMedicalRecordCreated({
      patientId: patientId,
      medicalRecord: {
        ...triageData,
        type: 'triage',
        id: generateId(),
      },
      recordType: 'triage',
    });
  };

  // The UI will automatically update when medical records are received
  // via socket events because the patient data in Redux is updated
  return (
    <div>
      <h3>Triage Records: {patient?.triages?.length || 0}</h3>
      <h3>Lab Work: {patient?.labworks?.length || 0}</h3>
      <h3>Pregnancy Records: {patient?.currentPregnancies?.length || 0}</h3>
      {/* Components will re-render automatically when new records arrive */}
    </div>
  );
};
`;

export default {
  demonstrateMedicalRecordEvents,
  exampleMedicalRecords,
  simulateMedicalRecordEvents,
  MedicalRecordEventExample,
};