// Screening Flow Configuration
// This file defines the order and flow of screening forms
// Easy to modify - just change the order or add/remove steps

export const SCREENING_FLOWS = {
  // Main Patient Screening Flow
  PATIENT_SCREENING: {
    id: 'patient_screening',
    name: 'Patient Screening Flow',
    description: 'Complete patient assessment from intake to diagnosis',
    steps: [
      {
        id: 'intake',
        name: 'Patient Intake',
        component: 'PatientIntake',
        description: 'Basic patient registration and demographics',
        icon: '📝',
        required: true
      },
      {
        id: 'visit',
        name: 'Patient Visit',
        component: 'PatientVisit',
        description: 'Visit details and chief complaint',
        icon: '🏥',
        required: true
      },
      {
        id: 'triage',
        name: 'Triage',
        component: 'Triage',
        description: 'Vital signs and basic assessment',
        icon: '🩺',
        required: true
      },
      {
        id: 'history',
        name: 'Patient History',
        component: 'PatientHistory',
        description: 'Medical and family history',
        icon: '📋',
        required: false
      },
      {
        id: 'lifestyle',
        name: 'Lifestyle Assessment',
        component: 'Lifestyle',
        description: 'Lifestyle and behavioral factors',
        icon: '🏃‍♀️',
        required: false
      },
      {
        id: 'infections',
        name: 'Infections test',
        component: 'Infections',
        description: 'Lifestyle and behavioral factors',
        icon: '🩺',
        required: false
      },
      {
        id: 'allergies',
        name: 'Alergies',
        component: 'Allergies',
        description: 'Lifestyle and behavioral factors',
        icon: '🩺',
        required: false
      }

    ]
  },

  // Pregnancy Specific Flow
  PREGNANCY_SCREENING: {
    id: 'pregnancy_screening',
    name: 'Pregnancy Screening Flow',
    description: 'Comprehensive pregnancy assessment',
    steps: [
     
      {
        id: 'visit',
        name: 'Patient Visit',
        component: 'PatientVisit',
        description: 'Visit details and chief complaint',
        icon: '🏥',
        required: true
      },
      {
        id: 'triage',
        name: 'Triage',
        component: 'Triage',
        description: 'Vital signs assessment',
        icon: '🩺',
        required: true
      },
      
      {
        id: 'ultrasound',
        name: 'Ultrasound',
        component: 'Ultrasound',
        description: 'Fetal ultrasound examination',
        icon: '🔍',
        required: false
      },
      {
        id: 'pregnancy',
        name: 'Pregnancy Assessment',
        component: 'Pregnancy',
        description: 'Pregnancy-specific information',
        icon: '🤱',
        required: true
      },
      {
        id: 'labwork',
        name: 'Lab Work',
        component: 'Labwork',
        description: 'Laboratory tests and results',
        icon: '🧪',
        required: false
      }
    ]
  },

  // Quick Assessment Flow
  QUICK_ASSESSMENT: {
    id: 'quick_assessment',
    name: 'Quick Assessment Flow',
    description: 'Streamlined assessment for follow-up visits',
    steps: [
      {
        id: 'visit',
        name: 'Patient Visit',
        component: 'PatientVisit',
        description: 'Visit details and symptoms',
        icon: '🏥',
        required: true
      },
      {
        id: 'triage',
        name: 'Triage',
        component: 'Triage',
        description: 'Vital signs check',
        icon: '🩺',
        required: true
      }
    ]
  }
};

// Default flow to use
export const DEFAULT_FLOW = 'PATIENT_SCREENING';

// Helper functions
export const getFlow = (flowId) => {
  return SCREENING_FLOWS[flowId] || SCREENING_FLOWS[DEFAULT_FLOW];
};

export const getNextStep = (flowId, currentStepId) => {
  const flow = getFlow(flowId);
  const currentIndex = flow.steps.findIndex(step => step.id === currentStepId);

  if (currentIndex === -1 || currentIndex === flow.steps.length - 1) {
    return null; // No next step
  }

  return flow.steps[currentIndex + 1];
};

export const getPreviousStep = (flowId, currentStepId) => {
  const flow = getFlow(flowId);
  const currentIndex = flow.steps.findIndex(step => step.id === currentStepId);

  if (currentIndex <= 0) {
    return null; // No previous step
  }

  return flow.steps[currentIndex - 1];
};

export const getStepProgress = (flowId, currentStepId) => {
  const flow = getFlow(flowId);
  const currentIndex = flow.steps.findIndex(step => step.id === currentStepId);

  return {
    current: currentIndex + 1,
    total: flow.steps.length,
    percentage: Math.round(((currentIndex + 1) / flow.steps.length) * 100)
  };
};

export const getAllFlows = () => {
  return Object.values(SCREENING_FLOWS);
};