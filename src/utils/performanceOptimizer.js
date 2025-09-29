/**
 * Performance optimizer for older Android devices
 * Reduces main thread blocking and improves responsiveness
 */

// Task scheduler for breaking up long-running operations
export const scheduleTask = (callback, priority = 'normal') => {
  if (typeof requestIdleCallback !== 'undefined') {
    const options = {
      timeout: priority === 'high' ? 100 : priority === 'low' ? 5000 : 1000
    };
    
    return requestIdleCallback((deadline) => {
      if (deadline.timeRemaining() > 0 || deadline.didTimeout) {
        callback();
      } else {
        // Reschedule if no time available
        setTimeout(callback, 0);
      }
    }, options);
  } else {
    // Fallback for browsers without requestIdleCallback
    return setTimeout(callback, 0);
  }
};

// Chunked task processor to prevent blocking
export const processInChunks = async (items, processor, chunkSize = 10) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  
  for (const chunk of chunks) {
    await new Promise(resolve => {
      scheduleTask(() => {
        chunk.forEach(processor);
        resolve();
      });
    });
  }
};

// Debounced function creator
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttled function creator
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Performance monitoring
export const performanceMonitor = {
  longTaskThreshold: 50, // ms
  
  measureTask: (name, task) => {
    const start = performance.now();
    const result = task();
    const duration = performance.now() - start;
    
    if (duration > performanceMonitor.longTaskThreshold) {
      console.warn(`Long task detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },
  
  measureAsyncTask: async (name, task) => {
    const start = performance.now();
    const result = await task();
    const duration = performance.now() - start;
    
    if (duration > performanceMonitor.longTaskThreshold) {
      console.warn(`Long async task detected: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }
};

// Optimize setTimeout for older devices
export const optimizedSetTimeout = (callback, delay = 0) => {
  if (delay === 0) {
    // Use MessageChannel for faster scheduling than setTimeout(0)
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port2.onmessage = () => callback();
      channel.port1.postMessage(null);
      return { cancel: () => channel.port2.onmessage = null };
    }
  }
  
  const timeoutId = setTimeout(callback, delay);
  return { cancel: () => clearTimeout(timeoutId) };
};

// Memory management helpers
export const memoryOptimizer = {
  // Clean up unused objects
  cleanup: () => {
    if (typeof window.gc === 'function') {
      window.gc();
    }
  },
  
  // Monitor memory usage
  getMemoryInfo: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
};

// Device capability detection
export const deviceCapabilities = {
  isLowEnd: () => {
    // Check for low-end device indicators
    const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
    const connection = navigator.connection;
    
    return (
      memory <= 2 || // 2GB or less RAM
      cores <= 2 || // 2 cores or less
      (connection && connection.effectiveType && 
       ['slow-2g', '2g', '3g'].includes(connection.effectiveType))
    );
  },
  
  getOptimalChunkSize: () => {
    return deviceCapabilities.isLowEnd() ? 5 : 10;
  },
  
  getOptimalDelay: () => {
    return deviceCapabilities.isLowEnd() ? 16 : 8; // Target 60fps or 120fps
  }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Reduce timer precision on low-end devices
  if (deviceCapabilities.isLowEnd()) {
    console.log('🐌 Low-end device detected, applying performance optimizations');
    
    // Override console methods to reduce logging overhead
    const originalLog = console.log;
    const originalWarn = console.warn;
    
    console.log = throttle(originalLog, 100);
    console.warn = throttle(originalWarn, 100);
    
    // Reduce animation frame rate
    const originalRAF = window.requestAnimationFrame;
    let rafThrottle = false;
    
    window.requestAnimationFrame = (callback) => {
      if (rafThrottle) return;
      rafThrottle = true;
      
      return originalRAF(() => {
        callback();
        setTimeout(() => rafThrottle = false, 16); // ~60fps max
      });
    };
  }
  
  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
};