/**
 * Simple Android Fix - Just works for all devices
 * No complexity, just prevents font errors and ensures app loads
 */

// Detect old Android
const isOldAndroid = () => {
  const ua = navigator.userAgent;
  const match = ua.match(/Android (\d+)/);
  return match && parseInt(match[1]) <= 10;
};

// Apply simple fixes immediately
const applySimpleFixes = () => {
  console.log('🔧 Applying simple Android fixes');
  
  // Block all font loading immediately
  if (window.FontFace) {
    window.FontFace = function() {
      return { load: () => Promise.resolve() };
    };
  }
  
  // Override document.fonts
  if (document.fonts) {
    document.fonts.add = () => {};
    document.fonts.load = () => Promise.resolve();
  }
  
  // Set safe fonts immediately
  const safeStyle = document.createElement('style');
  safeStyle.textContent = `
    * {
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif !important;
    }
    body {
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif !important;
    }
  `;
  document.head.insertBefore(safeStyle, document.head.firstChild);
  
  // Remove any existing font links
  const fontLinks = document.querySelectorAll('link[href*="font"]');
  fontLinks.forEach(link => link.remove());
  
  // Block font errors
  window.addEventListener('error', (e) => {
    if (e.message && (e.message.includes('font') || e.message.includes('CFF') || e.message.includes('OTS'))) {
      console.log('Font error blocked');
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
  }, true);
};

// Apply fixes if needed
if (isOldAndroid()) {
  applySimpleFixes();
}

export { isOldAndroid, applySimpleFixes };