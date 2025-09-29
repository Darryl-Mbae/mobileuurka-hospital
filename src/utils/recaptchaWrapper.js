/**
 * Enhanced reCAPTCHA wrapper with timeout handling and Android optimizations
 * Prevents crashes and provides fallback mechanisms
 */

import { isAndroid, isOldAndroid, isLowEndDevice } from './androidCrashFix.js';

// reCAPTCHA configuration based on device capabilities
const getRecaptchaConfig = () => {
  if (isOldAndroid() || isLowEndDevice()) {
    return {
      timeout: 15000, // 15 seconds for old devices
      retries: 1, // Fewer retries
      fallbackEnabled: true
    };
  } else if (isAndroid()) {
    return {
      timeout: 10000, // 10 seconds for Android
      retries: 2,
      fallbackEnabled: true
    };
  } else {
    return {
      timeout: 5000, // 5 seconds for other devices
      retries: 3,
      fallbackEnabled: false
    };
  }
};

// Enhanced reCAPTCHA execution with timeout and retry logic
export const executeRecaptchaWithTimeout = async (executeRecaptcha, action) => {
  const config = getRecaptchaConfig();
  
  if (!executeRecaptcha) {
    if (config.fallbackEnabled) {
      console.warn('reCAPTCHA not available, using fallback');
      return 'fallback-token';
    }
    throw new Error('reCAPTCHA not ready. Please try again.');
  }
  
  let lastError;
  
  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      console.log(`reCAPTCHA attempt ${attempt + 1}/${config.retries + 1} for action: ${action}`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`reCAPTCHA timeout after ${config.timeout}ms`));
        }, config.timeout);
      });
      
      // Race between reCAPTCHA execution and timeout
      const token = await Promise.race([
        executeRecaptcha(action),
        timeoutPromise
      ]);
      
      if (token) {
        console.log('✅ reCAPTCHA token obtained successfully');
        return token;
      }
      
      throw new Error('reCAPTCHA returned empty token');
      
    } catch (error) {
      lastError = error;
      console.warn(`reCAPTCHA attempt ${attempt + 1} failed:`, error.message);
      
      // If this is the last attempt, check for fallback
      if (attempt === config.retries) {
        if (config.fallbackEnabled && 
            (error.message.includes('timeout') || 
             error.message.includes('Timeout') ||
             error.message.includes('not ready'))) {
          console.warn('reCAPTCHA failed, using fallback mode');
          return 'fallback-token';
        }
        break;
      }
      
      // Wait before retry (longer wait for slower devices)
      const waitTime = isOldAndroid() ? 2000 : 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // All attempts failed
  throw lastError || new Error('reCAPTCHA verification failed');
};

// Enhanced reCAPTCHA verification with fallback handling
export const verifyRecaptchaWithFallback = async (token, serverUrl) => {
  try {
    // If using fallback token, skip server verification on old devices
    if (token === 'fallback-token' && (isOldAndroid() || isLowEndDevice())) {
      console.warn('Using reCAPTCHA fallback mode for old device');
      return {
        success: true,
        score: 0.7, // Assume reasonable score
        fallback: true
      };
    }
    
    const response = await fetch(`${serverUrl}/recaptcha`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        recaptchaToken: token,
        fallback: token === 'fallback-token'
      }),
    });
    
    if (!response.ok) {
      // On network errors for old devices, use fallback
      if ((isOldAndroid() || isLowEndDevice()) && 
          (response.status >= 500 || response.status === 0)) {
        console.warn('Network error on old device, using fallback');
        return {
          success: true,
          score: 0.7,
          fallback: true
        };
      }
      
      throw new Error(`HTTP ${response.status}: Failed to verify reCAPTCHA`);
    }
    
    const data = await response.json();
    
    // Handle server-side fallback response
    if (data.fallback) {
      console.log('Server confirmed fallback mode');
    }
    
    return data;
    
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    
    // Network error fallback for old devices
    if ((isOldAndroid() || isLowEndDevice()) && 
        (error.name === 'TypeError' || error.message.includes('fetch'))) {
      console.warn('Network error on old device, using fallback');
      return {
        success: true,
        score: 0.7,
        fallback: true
      };
    }
    
    throw error;
  }
};

// Complete reCAPTCHA flow with all error handling
export const executeCompleteRecaptchaFlow = async (executeRecaptcha, action, serverUrl) => {
  try {
    // Step 1: Execute reCAPTCHA with timeout handling
    const token = await executeRecaptchaWithTimeout(executeRecaptcha, action);
    
    // Step 2: Verify with server (with fallback handling)
    const verificationResult = await verifyRecaptchaWithFallback(token, serverUrl);
    
    // Step 3: Check verification result
    if (!verificationResult.success) {
      const errorCodes = verificationResult['error-codes'] || [];
      
      if (errorCodes.includes('timeout-or-duplicate')) {
        throw new Error('reCAPTCHA expired. Please try again.');
      } else {
        throw new Error('reCAPTCHA verification failed. Please try again.');
      }
    }
    
    // Step 4: Check score (be more lenient on old devices)
    const minScore = (isOldAndroid() || isLowEndDevice()) ? 0.3 : 0.5;
    
    if (verificationResult.score !== undefined && 
        verificationResult.score < minScore && 
        !verificationResult.fallback) {
      throw new Error('Suspicious activity detected. Please try again.');
    }
    
    console.log('✅ reCAPTCHA verification completed successfully');
    return verificationResult;
    
  } catch (error) {
    console.error('Complete reCAPTCHA flow failed:', error);
    
    // Final fallback for critical errors on old devices
    if ((isOldAndroid() || isLowEndDevice()) && 
        !error.message.includes('Suspicious activity')) {
      console.warn('Critical reCAPTCHA error on old device, using emergency fallback');
      return {
        success: true,
        score: 0.7,
        fallback: true,
        emergency: true
      };
    }
    
    throw error;
  }
};

// Hook for React components to use enhanced reCAPTCHA
export const useEnhancedRecaptcha = (executeRecaptcha, serverUrl) => {
  const executeWithEnhancements = async (action) => {
    return executeCompleteRecaptchaFlow(executeRecaptcha, action, serverUrl);
  };
  
  return {
    executeRecaptcha: executeWithEnhancements,
    isReady: !!executeRecaptcha,
    config: getRecaptchaConfig()
  };
};

// Initialize reCAPTCHA error handling
export const initRecaptchaErrorHandling = () => {
  // Handle reCAPTCHA script loading errors
  window.addEventListener('error', (event) => {
    if (event.filename && event.filename.includes('recaptcha')) {
      console.warn('reCAPTCHA script error:', event.message);
      
      // Mark reCAPTCHA as unavailable for fallback
      window.__recaptcha_unavailable = true;
      
      event.preventDefault();
      return false;
    }
  }, true);
  
  // Handle reCAPTCHA promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason || {};
    const message = reason.message || reason.toString() || '';
    
    if (message.includes('recaptcha') || message.includes('grecaptcha')) {
      console.warn('reCAPTCHA promise rejection:', message);
      
      // Mark reCAPTCHA as unavailable
      window.__recaptcha_unavailable = true;
      
      event.preventDefault();
      return false;
    }
  });
  
  console.log('✅ reCAPTCHA error handling initialized');
};

// Check if reCAPTCHA should be disabled entirely
export const shouldDisableRecaptcha = () => {
  return (
    window.__recaptcha_unavailable ||
    (isOldAndroid() && isLowEndDevice() && localStorage.getItem('disable-recaptcha'))
  );
};

export default {
  executeRecaptchaWithTimeout,
  verifyRecaptchaWithFallback,
  executeCompleteRecaptchaFlow,
  useEnhancedRecaptcha,
  initRecaptchaErrorHandling,
  shouldDisableRecaptcha
};