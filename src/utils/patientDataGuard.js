/**
 * Patient Data Guard - Prevents errors when patient data is undefined or incomplete
 * Addresses the "Cannot read properties of undefined (reading 'getPropertyValue')" error
 */

import React from 'react';

// Safe data access helpers
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  } catch (error) {
    console.warn('Safe get error:', error);
    return defaultValue;
  }
};

// Safe array access
export const safeArray = (arr, defaultValue = []) => {
  return Array.isArray(arr) ? arr : defaultValue;
};

// Safe patient data validator
export const validatePatientData = (patient) => {
  if (!patient) {
    return {
      isValid: false,
      errors: ['Patient data is null or undefined'],
      safePatient: createEmptyPatient()
    };
  }

  const errors = [];
  
  // Check required fields
  if (!patient.id) errors.push('Patient ID is missing');
  if (!patient.name) errors.push('Patient name is missing');
  
  return {
    isValid: errors.length === 0,
    errors,
    safePatient: patient
  };
};

// Create empty patient structure to prevent undefined errors
export const createEmptyPatient = () => ({
  id: null,
  name: 'Loading...',
  dob: null,
  bloodgroup: 'Unknown',
  rh: '',
  visits: [],
  patientHistories: [],
  lifestyles: [],
  allergies: [],
  triages: [],
  fetalInfos: [],
  labworks: [],
  riskAssessments: [],
  explanations: [],
  alerts: []
});

// Safe chart data processors
export const safeChartData = {
  weight: (triages) => {
    const safeTriages = safeArray(triages);
    return safeTriages
      .filter(triage => triage && triage.weight !== null && triage.weight !== undefined)
      .map(triage => ({
        date: triage.date || new Date().toISOString(),
        weight: parseFloat(triage.weight) || 0,
        gestationweek: parseInt(triage.gestationweek) || 0
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  },

  fetal: (fetalInfos) => {
    const safeFetalInfos = safeArray(fetalInfos);
    return safeFetalInfos
      .filter(info => info && info.gestationWeek !== null && info.gestationWeek !== undefined)
      .map(info => ({
        gestationWeek: parseInt(info.gestationWeek) || 0,
        gestationweek: parseInt(info.gestationweek) || parseInt(info.gestationWeek) || 0,
        fhr: parseFloat(info.fhr) || null,
        femurHeight: parseFloat(info.femurHeight) || null,
        headCircumference: parseFloat(info.headCircumference) || null
      }))
      .sort((a, b) => b.gestationWeek - a.gestationWeek)
      .slice(0, 5);
  }
};

// Safe DOM element access
export const safeDOMAccess = (element, property, defaultValue = null) => {
  try {
    if (!element) return defaultValue;
    
    // Check if element exists and has the property
    if (element && typeof element[property] !== 'undefined') {
      return element[property];
    }
    
    // Special handling for getComputedStyle
    if (property === 'getComputedStyle' && window.getComputedStyle) {
      const computedStyle = window.getComputedStyle(element);
      return computedStyle || defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Safe DOM access error for property ${property}:`, error);
    return defaultValue;
  }
};

// Safe CSS property access
export const safeGetPropertyValue = (element, property, defaultValue = '') => {
  try {
    if (!element) return defaultValue;
    
    const computedStyle = safeDOMAccess(element, 'getComputedStyle');
    if (computedStyle && typeof computedStyle.getPropertyValue === 'function') {
      return computedStyle.getPropertyValue(property) || defaultValue;
    }
    
    return defaultValue;
  } catch (error) {
    console.warn(`Safe getPropertyValue error for property ${property}:`, error);
    return defaultValue;
  }
};

// Chart container safety wrapper
export const withChartSafety = (ChartComponent) => {
  return function SafeChartWrapper(props) {
    const { patient, ...otherProps } = props;
    
    // Validate patient data
    const { isValid, safePatient } = validatePatientData(patient);
    
    // If patient data is invalid, show loading state
    if (!isValid) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          fontSize: '0.9em'
        }}>
          Loading chart data...
        </div>
      );
    }
    
    return <ChartComponent patient={safePatient} {...otherProps} />;
  };
};

// Error boundary for chart components
export class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Chart error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#666',
          fontSize: '0.9em',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div>Chart temporarily unavailable</div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '4px 8px',
              fontSize: '0.8em',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe patient field accessors
export const safePatientFields = {
  age: (patient) => {
    try {
      if (!patient?.dob) return 'Unknown';
      const today = new Date();
      const birthDate = new Date(patient.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      console.warn('Age calculation error:', error);
      return 'Unknown';
    }
  },

  bloodType: (patient) => {
    const bloodgroup = safeGet(patient, 'bloodgroup', 'Unknown');
    const rh = safeGet(patient, 'rh', '');
    return `${bloodgroup}${rh}`;
  },

  latestVisit: (patient) => {
    const visits = safeArray(safeGet(patient, 'visits', []));
    if (visits.length === 0) return null;
    return visits[visits.length - 1];
  },

  gravida: (patient) => {
    const histories = safeArray(safeGet(patient, 'patientHistories', []));
    return safeGet(histories, '0.gravida', 'Unknown');
  },

  parity: (patient) => {
    const histories = safeArray(safeGet(patient, 'patientHistories', []));
    return safeGet(histories, '0.parity', 'Unknown');
  }
};

export default {
  safeGet,
  safeArray,
  validatePatientData,
  createEmptyPatient,
  safeChartData,
  safeDOMAccess,
  safeGetPropertyValue,
  withChartSafety,
  ChartErrorBoundary,
  safePatientFields
};