/**
 * Optimized socket configuration for older Android devices
 * Reduces performance impact and prevents blocking operations
 */

import { scheduleTask, throttle, debounce } from './performanceOptimizer.js';

// Detect if device needs performance optimizations
const needsOptimization = () => {
  const userAgent = navigator.userAgent;
  const androidMatch = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  const isOldAndroid = androidMatch && parseFloat(androidMatch[1]) <= 10;
  
  // Also check for low-end device indicators
  const isLowEnd = (
    navigator.deviceMemory && navigator.deviceMemory <= 2 ||
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
  );
  
  return isOldAndroid || isLowEnd;
};

// Optimized socket event handlers
export const createOptimizedSocketHandlers = (originalSocket) => {
  if (!needsOptimization()) {
    return originalSocket; // Return original socket for modern devices
  }
  
  console.log('🔧 Applying socket optimizations for older device');
  
  // Throttle frequent events to prevent performance issues
  const throttledHandlers = {
    'online_users_updated': throttle((data) => {
      scheduleTask(() => {
        originalSocket.emit('online_users_updated_processed', data);
      }, 'low');
    }, 1000),
    
    'user_online': throttle((data) => {
      scheduleTask(() => {
        originalSocket.emit('user_online_processed', data);
      }, 'low');
    }, 500),
    
    'user_offline': throttle((data) => {
      scheduleTask(() => {
        originalSocket.emit('user_offline_processed', data);
      }, 'low');
    }, 500),
    
    'heartbeat': throttle(() => {
      // Reduce heartbeat frequency for old devices
      if (originalSocket.connected) {
        originalSocket.emit('ping');
      }
    }, 30000), // 30 seconds instead of default
  };
  
  // Debounce batch operations
  const debouncedHandlers = {
    'users_updated': debounce((data) => {
      scheduleTask(() => {
        originalSocket.emit('users_updated_processed', data);
      }, 'normal');
    }, 2000),
    
    'patients_updated': debounce((data) => {
      scheduleTask(() => {
        originalSocket.emit('patients_updated_processed', data);
      }, 'normal');
    }, 2000),
  };
  
  // Override socket event handlers
  const originalOn = originalSocket.on.bind(originalSocket);
  originalSocket.on = function(event, handler) {
    if (throttledHandlers[event]) {
      return originalOn(event, throttledHandlers[event]);
    }
    
    if (debouncedHandlers[event]) {
      return originalOn(event, debouncedHandlers[event]);
    }
    
    // Wrap other handlers in scheduled tasks
    return originalOn(event, (...args) => {
      scheduleTask(() => {
        try {
          handler(...args);
        } catch (error) {
          console.warn(`Socket handler error for ${event}:`, error);
        }
      }, 'normal');
    });
  };
  
  // Optimize emit operations
  const originalEmit = originalSocket.emit.bind(originalSocket);
  originalSocket.emit = function(event, ...args) {
    // Schedule non-critical emits
    const criticalEvents = ['ping', 'pong', 'connect', 'disconnect'];
    
    if (criticalEvents.includes(event)) {
      return originalEmit(event, ...args);
    }
    
    scheduleTask(() => {
      originalEmit(event, ...args);
    }, 'low');
  };
  
  return originalSocket;
};

// Optimized socket configuration
export const getOptimizedSocketConfig = () => {
  const baseConfig = {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    randomizationFactor: 0.5,
    forceNew: false,
    autoConnect: true,
  };
  
  if (needsOptimization()) {
    return {
      ...baseConfig,
      // More conservative settings for old devices
      timeout: 30000, // Longer timeout
      reconnectionAttempts: 3, // Fewer attempts
      reconnectionDelay: 3000, // Longer delay
      reconnectionDelayMax: 15000, // Much longer max delay
      transports: ['polling'], // Use polling only for stability
      upgrade: false, // Don't upgrade to websocket
      rememberUpgrade: false,
      // Reduce polling frequency
      pollingTimeout: 30000,
      // Disable compression to reduce CPU usage
      compression: false,
      // Reduce buffer size
      bufferSize: 100,
    };
  }
  
  return baseConfig;
};

// Memory-efficient event batching
export class EventBatcher {
  constructor(flushInterval = 1000) {
    this.events = new Map();
    this.flushInterval = flushInterval;
    this.flushTimer = null;
    this.maxBatchSize = needsOptimization() ? 10 : 50;
  }
  
  addEvent(type, data) {
    if (!this.events.has(type)) {
      this.events.set(type, []);
    }
    
    const eventList = this.events.get(type);
    eventList.push(data);
    
    // Flush immediately if batch is full
    if (eventList.length >= this.maxBatchSize) {
      this.flush();
      return;
    }
    
    // Schedule flush
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }
  
  flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    
    if (this.events.size === 0) return;
    
    // Process events in chunks to avoid blocking
    scheduleTask(() => {
      for (const [type, events] of this.events.entries()) {
        this.processBatch(type, events);
      }
      this.events.clear();
    }, 'normal');
  }
  
  processBatch(type, events) {
    // Override this method to handle specific event types
    console.log(`Processing batch of ${events.length} ${type} events`);
  }
}

// Optimized connection manager
export class OptimizedConnectionManager {
  constructor() {
    this.isOptimized = needsOptimization();
    this.connectionState = 'disconnected';
    this.eventBatcher = new EventBatcher();
    this.performanceMetrics = {
      eventCount: 0,
      lastEventTime: 0,
      averageEventInterval: 0,
    };
  }
  
  trackEvent() {
    const now = Date.now();
    this.performanceMetrics.eventCount++;
    
    if (this.performanceMetrics.lastEventTime > 0) {
      const interval = now - this.performanceMetrics.lastEventTime;
      this.performanceMetrics.averageEventInterval = 
        (this.performanceMetrics.averageEventInterval + interval) / 2;
    }
    
    this.performanceMetrics.lastEventTime = now;
    
    // Log performance warnings
    if (this.performanceMetrics.averageEventInterval < 100) {
      console.warn('High frequency socket events detected, consider batching');
    }
  }
  
  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      isOptimized: this.isOptimized,
      connectionState: this.connectionState,
    };
  }
}

export { needsOptimization };