/**
 * Font loading test utility
 * Use this to test font loading on different devices
 */

export const testFontLoading = () => {
  console.log('🔍 Testing font loading...');
  
  // Device detection
  const userAgent = navigator.userAgent;
  const isAndroid = /Android/.test(userAgent);
  const androidVersion = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  const isOldAndroid = androidVersion && parseFloat(androidVersion[1]) <= 10;
  
  console.log('📱 Device Info:', {
    userAgent,
    isAndroid,
    androidVersion: androidVersion ? androidVersion[1] : 'N/A',
    isOldAndroid
  });
  
  // Font API support
  const fontApiSupported = 'fonts' in document;
  console.log('🔤 Font API supported:', fontApiSupported);
  
  // CSS support
  const cssSupportsAvailable = window.CSS && CSS.supports;
  console.log('🎨 CSS.supports available:', cssSupportsAvailable);
  
  // Current font family
  const computedStyle = window.getComputedStyle(document.body);
  const currentFont = computedStyle.fontFamily;
  console.log('📝 Current font family:', currentFont);
  
  // Test font loading
  if (fontApiSupported && document.fonts.check) {
    try {
      const interAvailable = document.fonts.check('1em Inter');
      console.log('✅ Inter font available:', interAvailable);
    } catch (error) {
      console.warn('❌ Font check failed:', error);
    }
  }
  
  // CSS variables
  const primaryFont = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-family-primary');
  const fallbackFont = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-family-fallback');
    
  console.log('🔧 CSS Variables:', {
    primary: primaryFont,
    fallback: fallbackFont
  });
  
  // Body classes
  const bodyClasses = Array.from(document.body.classList);
  console.log('🏷️ Body classes:', bodyClasses);
  
  return {
    isAndroid,
    isOldAndroid,
    fontApiSupported,
    cssSupportsAvailable,
    currentFont,
    primaryFont,
    fallbackFont,
    bodyClasses
  };
};

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  // Run test after a short delay to ensure everything is loaded
  setTimeout(testFontLoading, 1000);
}

// Export for manual testing
window.testFontLoading = testFontLoading;