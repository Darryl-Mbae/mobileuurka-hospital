/**
 * Comprehensive Android crash fix for reCAPTCHA timeouts and performance issues
 * Addresses the specific errors causing crashes on Android devices
 */

// Detect Android devices
export const isAndroid = () => /Android/i.test(navigator.userAgent);

// Detect old/slow Android devices
export const isOldAndroid = () => {
  const ua = navigator.userAgent;
  if (!/Android/i.test(ua)) return false;
  
  const match = ua.match(/Android (\d+)/);
  const version = match ? parseInt(match[1]) : 0;
  
  // Consider Android 10 and below as "old"
  return version <= 10;
};

// Detect low-end devices
export const isLowEndDevice = () => {
  const memory = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = navigator.connection;
  
  return (
    memory <= 2 || // 2GB or less RAM
    cores <= 2 || // 2 cores or less
    (connection && connection.effectiveType && 
     ['slow-2g', '2g', '3g'].includes(connection.effectiveType))
  );
};

// Enhanced timeout handler for reCAPTCHA
export const createTimeoutHandler = (originalSetTimeout) => {
  return function(callback, delay, ...args) {
    // Increase timeouts on Android devices to prevent violations
    if (isAndroid()) {
      // Minimum 100ms delay for Android to prevent violations
      delay = Math.max(delay || 0, 100);
      
      // Double timeouts on old Android devices
      if (isOldAndroid() || isLowEndDevice()) {
        delay = Math.max(delay * 2, 200);
      }
    }
    
    return originalSetTimeout.call(this, callback, delay, ...args);
  };
};

// Enhanced requestIdleCallback for Android
export const createIdleCallbackHandler = (originalRequestIdleCallback) => {
  return function(callback, options = {}) {
    if (isAndroid()) {
      // Increase timeout for Android devices
      options.timeout = Math.max(options.timeout || 1000, 2000);
      
      // Even longer timeout for old devices
      if (isOldAndroid() || isLowEndDevice()) {
        options.timeout = Math.max(options.timeout * 2, 5000);
      }
    }
    
    if (originalRequestIdleCallback) {
      return originalRequestIdleCallback.call(this, callback, options);
    } else {
      // Fallback for browsers without requestIdleCallback
      return setTimeout(callback, options.timeout || 100);
    }
  };
};

// Message handler optimization for Android
export const optimizeMessageHandlers = () => {
  if (!isAndroid()) return;
  
  // Throttle message events to prevent violations
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'message' && typeof listener === 'function') {
      // Throttle message handlers on Android
      const throttledListener = throttle(listener, isOldAndroid() ? 100 : 50);
      return originalAddEventListener.call(this, type, throttledListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };
};

// Throttle function
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Prevent forced reflows on Android
export const preventForcedReflows = () => {
  if (!isAndroid()) return;
  
  // Override problematic DOM methods that cause reflows
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  const originalGetComputedStyle = window.getComputedStyle;
  
  // Throttle getBoundingClientRect calls
  Element.prototype.getBoundingClientRect = throttle(function() {
    return originalGetBoundingClientRect.call(this);
  }, 16); // ~60fps
  
  // Throttle getComputedStyle calls
  window.getComputedStyle = throttle(function(element, pseudoElement) {
    return originalGetComputedStyle.call(this, element, pseudoElement);
  }, 16);
};

// reCAPTCHA specific fixes
export const fixRecaptchaTimeouts = () => {
  if (!window.grecaptcha) return;
  
  // Override reCAPTCHA ready function with timeout handling
  const originalReady = window.grecaptcha.ready;
  
  window.grecaptcha.ready = function(callback) {
    const timeoutMs = isAndroid() ? (isOldAndroid() ? 10000 : 5000) : 3000;
    
    const timeoutId = setTimeout(() => {
      console.warn('reCAPTCHA ready timeout, proceeding anyway');
      try {
        callback();
      } catch (e) {
        console.error('reCAPTCHA callback error:', e);
      }
    }, timeoutMs);
    
    if (originalReady) {
      originalReady.call(this, () => {
        clearTimeout(timeoutId);
        try {
          callback();
        } catch (e) {
          console.error('reCAPTCHA callback error:', e);
        }
      });
    } else {
      // Fallback if ready is not available
      setTimeout(() => {
        clearTimeout(timeoutId);
        try {
          callback();
        } catch (e) {
          console.error('reCAPTCHA fallback callback error:', e);
        }
      }, 1000);
    }
  };
};

// Enhanced error handling for reCAPTCHA
export const enhanceRecaptchaErrorHandling = () => {
  // Catch and handle reCAPTCHA errors
  window.addEventListener('error', (event) => {
    const error = event.error || event;
    const message = error.message || event.message || '';
    
    // Handle reCAPTCHA timeout errors
    if (message.includes('Timeout') && 
        (event.filename || '').includes('recaptcha')) {
      console.warn('reCAPTCHA timeout error caught and handled');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Handle other reCAPTCHA errors
    if (message.includes('recaptcha') || 
        (event.filename || '').includes('recaptcha')) {
      console.warn('reCAPTCHA error caught:', message);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Handle unhandled promise rejections from reCAPTCHA
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = reason.message || reason.toString() || '';
    
    if (message.includes('recaptcha') || message.includes('Timeout')) {
      console.warn('reCAPTCHA promise rejection caught:', message);
      event.preventDefault();
      return false;
    }
  });
};

// Performance monitoring and optimization
export const initPerformanceMonitoring = () => {
  if (!isAndroid()) return;
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
            
            // If we detect too many long tasks, enable safe mode
            if (entry.duration > 200) {
              console.warn('Extremely long task detected, consider enabling safe mode');
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.log('PerformanceObserver not supported');
    }
  }
  
  // Monitor memory usage
  if (performance.memory) {
    setInterval(() => {
      const memory = performance.memory;
      const used = Math.round(memory.usedJSHeapSize / 1048576);
      const limit = Math.round(memory.jsHeapSizeLimit / 1048576);
      
      if (used / limit > 0.8) {
        console.warn(`High memory usage: ${used}MB / ${limit}MB`);
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }
    }, 30000); // Check every 30 seconds
  }
};

// Main initialization function
export const initAndroidCrashFix = () => {
  if (!isAndroid()) {
    console.log('Not Android, skipping Android-specific fixes');
    return;
  }
  
  console.log('🤖 Android detected, applying crash fixes...');
  
  // Apply all fixes
  const originalSetTimeout = window.setTimeout;
  const originalRequestIdleCallback = window.requestIdleCallback;
  
  // Override timeout functions
  window.setTimeout = createTimeoutHandler(originalSetTimeout);
  
  if (originalRequestIdleCallback) {
    window.requestIdleCallback = createIdleCallbackHandler(originalRequestIdleCallback);
  }
  
  // Apply other optimizations
  optimizeMessageHandlers();
  preventForcedReflows();
  enhanceRecaptchaErrorHandling();
  initPerformanceMonitoring();
  
  // Apply reCAPTCHA fixes after a delay to ensure reCAPTCHA is loaded
  setTimeout(() => {
    fixRecaptchaTimeouts();
  }, 2000);
  
  console.log('✅ Android crash fixes applied');
};

// Safe mode fallback for extremely problematic devices
export const enableSafeMode = () => {
  console.log('🛡️ Enabling safe mode for problematic device');
  
  // Disable all animations
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(style);
  
  // Disable complex features
  localStorage.setItem('android-safe-mode', 'true');
  
  // Reload page to apply safe mode
  setTimeout(() => {
    window.location.reload();
  }, 1000);
};

// Check if safe mode should be enabled
export const shouldEnableSafeMode = () => {
  return (
    isOldAndroid() && 
    isLowEndDevice() && 
    !localStorage.getItem('android-safe-mode')
  );
};

// Export all functions
export default {
  initAndroidCrashFix,
  isAndroid,
  isOldAndroid,
  isLowEndDevice,
  enableSafeMode,
  shouldEnableSafeMode,
  fixRecaptchaTimeouts,
  enhanceRecaptchaErrorHandling
};