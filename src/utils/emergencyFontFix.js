/**
 * Emergency font fix - prevents all font loading on problematic devices
 * This runs BEFORE React and prevents font errors entirely
 */

// Detect Android version immediately
const detectAndroidVersion = () => {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

const isProblematicDevice = () => {
  const androidVersion = detectAndroidVersion();
  return androidVersion !== null && androidVersion <= 10;
};

// Emergency font prevention
const preventFontLoading = () => {
  console.log('🚨 Emergency font prevention activated');
  
  // Override font loading APIs
  if (window.FontFace) {
    window.FontFace = function() {
      console.warn('FontFace constructor blocked');
      return { load: () => Promise.resolve() };
    };
  }
  
  // Block font loading in document.fonts
  if (document.fonts) {
    const originalAdd = document.fonts.add;
    document.fonts.add = function() {
      console.warn('Font add blocked');
      return;
    };
    
    const originalLoad = document.fonts.load;
    document.fonts.load = function() {
      console.warn('Font load blocked');
      return Promise.resolve();
    };
  }
  
  // Intercept and remove font links
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'LINK' && 
              (node.href?.includes('font') || node.href?.includes('googleapis'))) {
            console.warn('Removing font link:', node.href);
            node.remove();
          }
          
          // Check for font links in added subtrees
          const fontLinks = node.querySelectorAll?.('link[href*="font"], link[href*="googleapis"]');
          fontLinks?.forEach(link => {
            console.warn('Removing nested font link:', link.href);
            link.remove();
          });
        }
      });
    });
  });
  
  observer.observe(document.head, { childList: true, subtree: true });
  
  // Set emergency CSS immediately
  const emergencyStyle = document.createElement('style');
  emergencyStyle.id = 'emergency-font-fix';
  emergencyStyle.textContent = `
    /* Emergency font override */
    * {
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif !important;
    }
    
    /* Block all font-face declarations */
    @font-face {
      font-family: 'Inter';
      src: local('Roboto'), local('Arial');
    }
    
    /* Hide content until fonts are safe */
    #root {
      visibility: visible !important;
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif !important;
    }
    
    /* Ensure all elements use safe fonts */
    body, div, span, p, h1, h2, h3, h4, h5, h6, 
    input, textarea, select, button, label {
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif !important;
    }
  `;
  
  document.head.insertBefore(emergencyStyle, document.head.firstChild);
  
  // Set CSS variables immediately
  document.documentElement.style.setProperty(
    '--font-family-primary', 
    'system-ui, -apple-system, Roboto, Arial, sans-serif'
  );
  document.documentElement.style.setProperty(
    '--font-family-fallback', 
    'system-ui, -apple-system, Roboto, Arial, sans-serif'
  );
  
  // Add body classes
  document.body.classList.add('emergency-font-fix', 'android-safe-mode');
  
  return true;
};

// Apply emergency fix immediately if needed
if (isProblematicDevice()) {
  console.log('🔧 Problematic Android device detected, applying emergency font fix');
  preventFontLoading();
  
  // Also prevent any future font loading attempts
  window.addEventListener('DOMContentLoaded', preventFontLoading);
  
  // Block font loading errors from propagating
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('font') ||
      event.message.includes('CFF') ||
      event.message.includes('OTS') ||
      event.message.includes('Invalid font data')
    )) {
      console.warn('Font error blocked:', event.message);
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }, true); // Use capture phase
}

export { isProblematicDevice, preventFontLoading };