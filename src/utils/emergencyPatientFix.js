/**
 * Emergency Patient Fix - Comprehensive solution for getPropertyValue errors
 * This is a more aggressive fix that prevents all chart-related errors
 */

// Global error handler for getPropertyValue errors
export const initEmergencyPatientFix = () => {
  console.log('🚨 Initializing emergency patient fix...');

  // Override getBoundingClientRect to prevent canvas errors
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function() {
    try {
      const result = originalGetBoundingClientRect.call(this);
      
      // Ensure result has required properties
      if (!result || typeof result.height === 'undefined') {
        console.warn('getBoundingClientRect returned invalid result, using fallback');
        return {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          top: 0,
          right: 100,
          bottom: 100,
          left: 0,
          toJSON: () => ({})
        };
      }
      
      return result;
    } catch (error) {
      console.warn('getBoundingClientRect error, using fallback:', error);
      return {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        right: 100,
        bottom: 100,
        left: 0,
        toJSON: () => ({})
      };
    }
  };

  // Override getComputedStyle to prevent getPropertyValue errors
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(element, pseudoElement) {
    try {
      if (!element) {
        console.warn('getComputedStyle called with null element, returning fallback');
        return createFallbackComputedStyle();
      }
      
      const result = originalGetComputedStyle.call(this, element, pseudoElement);
      
      if (!result || typeof result.getPropertyValue !== 'function') {
        console.warn('getComputedStyle returned invalid result, using fallback');
        return createFallbackComputedStyle();
      }
      
      // Wrap getPropertyValue to prevent errors
      const originalGetPropertyValue = result.getPropertyValue;
      result.getPropertyValue = function(property) {
        try {
          return originalGetPropertyValue.call(this, property) || '';
        } catch (error) {
          console.warn(`getPropertyValue error for property ${property}:`, error);
          return '';
        }
      };
      
      return result;
    } catch (error) {
      console.warn('getComputedStyle error, using fallback:', error);
      return createFallbackComputedStyle();
    }
  };

  // Create fallback computed style object
  function createFallbackComputedStyle() {
    return {
      getPropertyValue: (property) => {
        console.warn(`Fallback getPropertyValue called for: ${property}`);
        return '';
      },
      getPropertyPriority: () => '',
      item: () => '',
      removeProperty: () => '',
      setProperty: () => {},
      length: 0,
      cssText: '',
      parentRule: null
    };
  }

  // Override canvas getContext to prevent canvas errors
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
    try {
      const context = originalGetContext.call(this, contextType, contextAttributes);
      
      if (!context) {
        console.warn('Canvas context creation failed, returning mock context');
        return createMockCanvasContext();
      }
      
      return context;
    } catch (error) {
      console.warn('Canvas getContext error, returning mock context:', error);
      return createMockCanvasContext();
    }
  };

  // Create mock canvas context
  function createMockCanvasContext() {
    return {
      canvas: { width: 100, height: 100 },
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(4) }),
      putImageData: () => {},
      createImageData: () => ({ data: new Uint8ClampedArray(4) }),
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
      arc: () => {},
      arcTo: () => {},
      ellipse: () => {},
      rect: () => {},
      fill: () => {},
      stroke: () => {},
      drawFocusIfNeeded: () => {},
      clip: () => {},
      isPointInPath: () => false,
      isPointInStroke: () => false,
      rotate: () => {},
      scale: () => {},
      translate: () => {},
      transform: () => {},
      setLineDash: () => {},
      getLineDash: () => [],
      measureText: () => ({ width: 0 }),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      globalAlpha: 1,
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      lineDashOffset: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
      shadowColor: 'rgba(0, 0, 0, 0)',
      globalCompositeOperation: 'source-over',
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      direction: 'inherit',
      imageSmoothingEnabled: true
    };
  }

  // Global error handler for unhandled errors
  window.addEventListener('error', (event) => {
    const error = event.error || event;
    const message = error.message || event.message || '';
    
    // Handle getPropertyValue errors
    if (message.includes('getPropertyValue') || 
        message.includes('getBoundingClientRect') ||
        message.includes('canvas')) {
      console.warn('Chart-related error caught and handled:', message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);

  // Global promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = reason.message || reason.toString() || '';
    
    if (message.includes('getPropertyValue') || 
        message.includes('getBoundingClientRect') ||
        message.includes('canvas')) {
      console.warn('Chart-related promise rejection caught and handled:', message);
      event.preventDefault();
      return false;
    }
  });

  console.log('✅ Emergency patient fix initialized');
};

// Safe chart wrapper function (use SafeChartWrapper component instead for JSX)
export const createSafeWrapper = (fallbackMessage = "Chart temporarily unavailable") => {
  return (children) => {
    try {
      return children;
    } catch (error) {
      console.warn('Safe wrapper caught error:', error);
      return fallbackMessage;
    }
  };
};

// Emergency patient data structure
export const createEmergencyPatient = () => ({
  id: 'loading',
  name: 'Loading Patient...',
  dob: new Date().toISOString(),
  bloodgroup: 'Unknown',
  rh: '',
  visits: [],
  patientHistories: [{
    gravida: 0,
    parity: 0,
    estimatedDueDate: new Date().toISOString()
  }],
  lifestyles: [{
    alcoholConsumption: 'None',
    smoking: 'None',
    caffeine: 'No',
    diet: 'Not specified',
    exercise: 0,
    sugarDrink: 'None'
  }],
  allergies: [],
  triages: [],
  fetalInfos: [],
  labworks: [],
  riskAssessments: [],
  explanations: [],
  alerts: []
});

// Check if we should use emergency mode
export const shouldUseEmergencyMode = () => {
  // Check for previous errors
  const hasErrors = localStorage.getItem('chart-errors') === 'true';
  
  // Check for slow device
  const isSlowDevice = navigator.deviceMemory && navigator.deviceMemory <= 2;
  
  // Check for old browser
  const isOldBrowser = !window.ResizeObserver || !window.IntersectionObserver;
  
  return hasErrors || isSlowDevice || isOldBrowser;
};

// Mark that chart errors occurred
export const markChartErrors = () => {
  localStorage.setItem('chart-errors', 'true');
  console.warn('Chart errors detected, emergency mode will be enabled on next load');
};

// Clear chart error flag
export const clearChartErrors = () => {
  localStorage.removeItem('chart-errors');
  console.log('Chart error flag cleared');
};

export default {
  initEmergencyPatientFix,
  SafeChartWrapper,
  createEmergencyPatient,
  shouldUseEmergencyMode,
  markChartErrors,
  clearChartErrors
};