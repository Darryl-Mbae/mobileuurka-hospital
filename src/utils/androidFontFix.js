/**
 * Android-specific font fixes for older devices
 */

export const detectAndroidVersion = () => {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
};

export const isOldAndroid = () => {
  const version = detectAndroidVersion();
  return version !== null && version <= 10;
};

export const applyAndroidFontFixes = () => {
  if (!isOldAndroid()) {
    return false;
  }

  console.log('Applying Android font fixes for older device');

  // Remove any existing font links that might cause issues
  const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
  fontLinks.forEach(link => {
    link.remove();
  });

  // Apply safe font stack
  const safeFonts = 'system-ui, -apple-system, Roboto, "Droid Sans", Arial, sans-serif';
  
  // Set CSS variables
  document.documentElement.style.setProperty('--font-family-primary', safeFonts);
  document.documentElement.style.setProperty('--font-family-fallback', safeFonts);

  // Add Android-specific styles
  const style = document.createElement('style');
  style.textContent = `
    /* Android font fixes */
    * {
      font-family: ${safeFonts} !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Prevent font loading */
    @font-face {
      font-family: 'Inter';
      src: local('Roboto'), local('Arial');
    }
    
    /* Force system fonts on Android */
    body, input, textarea, select, button {
      font-family: ${safeFonts} !important;
    }
  `;
  
  document.head.appendChild(style);

  // Add class to body for targeting
  document.body.classList.add('android-old-device');
  
  return true;
};

// Auto-apply fixes if needed
if (isOldAndroid()) {
  // Apply fixes immediately
  applyAndroidFontFixes();
  
  // Also apply when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAndroidFontFixes);
  }
}