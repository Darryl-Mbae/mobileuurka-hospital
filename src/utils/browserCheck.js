// Browser compatibility check
export const checkBrowserCompatibility = () => {
  const userAgent = navigator.userAgent;
  const isOldSafari = /Safari/.test(userAgent) && /Version\/([0-9]+)/.test(userAgent);
  const isOldChrome = /Chrome\/([0-9]+)/.test(userAgent);
  const isOldFirefox = /Firefox\/([0-9]+)/.test(userAgent);
  
  let warnings = [];
  
  // Check Safari version
  if (isOldSafari) {
    const safariVersion = userAgent.match(/Version\/([0-9]+)/);
    if (safariVersion && parseInt(safariVersion[1]) < 14) {
      warnings.push('Your Safari version is quite old. Some features may not work properly.');
    }
  }
  
  // Check Chrome version
  if (isOldChrome) {
    const chromeVersion = userAgent.match(/Chrome\/([0-9]+)/);
    if (chromeVersion && parseInt(chromeVersion[1]) < 90) {
      warnings.push('Your Chrome version is quite old. Please consider updating for the best experience.');
    }
  }
  
  // Check for very old iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  if (isIOS) {
    const iosVersion = userAgent.match(/OS (\d+)_/);
    if (iosVersion && parseInt(iosVersion[1]) < 14) {
      warnings.push('Your iOS version is quite old. Some features may not work properly.');
    }
  }
  
  // Check for essential features
  const missingFeatures = [];
  
  if (!window.fetch) {
    missingFeatures.push('fetch API');
  }
  
  if (!window.Promise) {
    missingFeatures.push('Promises');
  }
  
  if (!Array.prototype.includes) {
    missingFeatures.push('Array.includes');
  }
  
  if (missingFeatures.length > 0) {
    warnings.push(`Your browser is missing support for: ${missingFeatures.join(', ')}`);
  }
  
  return {
    isCompatible: warnings.length === 0,
    warnings,
    userAgent,
    browserInfo: {
      isIOS,
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isChrome: /Chrome/.test(userAgent),
      isFirefox: /Firefox/.test(userAgent),
      isMobile: /Mobi|Android/i.test(userAgent)
    }
  };
};

export const showCompatibilityWarning = (warnings) => {
  if (warnings.length === 0) return;
  
  console.warn('Browser compatibility issues detected:', warnings);
  
  // Show a non-intrusive warning
  const warningDiv = document.createElement('div');
  warningDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #fff3cd;
    color: #856404;
    padding: 10px;
    text-align: center;
    font-size: 14px;
    z-index: 10000;
    border-bottom: 1px solid #ffeaa7;
  `;
  
  warningDiv.innerHTML = `
    <strong>Browser Compatibility Notice:</strong> 
    ${warnings[0]} 
    <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: none; border: 1px solid #856404; color: #856404; padding: 2px 8px; cursor: pointer;">
      Dismiss
    </button>
  `;
  
  document.body.insertBefore(warningDiv, document.body.firstChild);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (warningDiv.parentElement) {
      warningDiv.remove();
    }
  }, 10000);
};