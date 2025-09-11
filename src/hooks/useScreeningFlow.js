import { useNavigate } from 'react-router-dom';
import { getNextStep, getFlow } from '../config/screeningFlowConfig';

export const useScreeningFlow = (setInternalTab) => {
  const navigate = useNavigate();

  const navigateToNextStep = ({ nextStep, patientId, flowId, progress }) => {
    console.log('Navigating to next step:', {
      nextStep: nextStep.name,
      component: nextStep.component,
      patientId,
      flowId,
      progress
    });

    // Map component names to internal tab numbers (matching Screening.jsx)
    const componentToTabMap = {
      'PatientIntake': 2.1,
      'PatientHistory': 2.2,
      'Lifestyle': 2.3,
      'PatientVisit': 2.4,
      'Allergies': 2.5,
      'Triage': 2.6,
      'Pregnancy': 2.7,
      'Labwork': 2.8,
      'Infections': 2.9,
      'Fetal': 2.11,
      'Ultrasound': 2.12,
      'Prescription': 2.13
    };
    console.log(nextStep)

    const tabNumber = componentToTabMap[nextStep.component];
    
    if (tabNumber && setInternalTab) {
      // Store the patient ID and flow info for the next form
      sessionStorage.setItem('screeningPatientId', patientId);
      sessionStorage.setItem('screeningFlowId', flowId);
      sessionStorage.setItem('screeningCurrentStep', nextStep.id);
      
      // Navigate to the next form using the numeric tab
      setInternalTab(tabNumber);
    } else {
      console.warn('Unknown component or missing setInternalTab:', nextStep.component);
    }
  };

  const getScreeningContext = () => {
    return {
      patientId: sessionStorage.getItem('screeningPatientId'),
      flowId: sessionStorage.getItem('screeningFlowId') || 'PATIENT_SCREENING',
      currentStepId: sessionStorage.getItem('screeningCurrentStep')
    };
  };

  const clearScreeningContext = () => {
    sessionStorage.removeItem('screeningPatientId');
    sessionStorage.removeItem('screeningFlowId');
    sessionStorage.removeItem('screeningCurrentStep');
  };

  const getCurrentStepInfo = (componentName) => {
    const context = getScreeningContext();
    const flow = getFlow(context.flowId);
    
    // Find the step that matches the current component
    const currentStep = flow.steps.find(step => 
      step.component === componentName
    );
    
    return {
      ...context,
      currentStep,
      stepId: currentStep?.id
    };
  };

  return {
    navigateToNextStep,
    getScreeningContext,
    clearScreeningContext,
    getCurrentStepInfo
  };
};