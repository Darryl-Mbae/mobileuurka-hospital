/**
 * Font loading utility for older Android devices
 * Handles font loading gracefully with fallbacks
 */

// Safe font loading for older browsers
export const loadFontsGracefully = () => {
  // Check if browser supports font loading API
  if (!('fonts' in document)) {
    console.warn('Font loading API not supported, using fallback fonts');
    return Promise.resolve();
  }

  // Define font fallback stack
  const fontFallbacks = [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif'
  ];

  // Set fallback fonts immediately
  document.documentElement.style.setProperty(
    '--font-family-fallback', 
    fontFallbacks.join(', ')
  );

  // Try to load Inter font with timeout
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('Font loading timeout, using fallback fonts');
      resolve();
    }, 3000);

    // Check if Inter is available
    if (document.fonts && document.fonts.check) {
      try {
        if (document.fonts.check('1em Inter')) {
          clearTimeout(timeout);
          document.documentElement.style.setProperty(
            '--font-family-primary', 
            `Inter, ${fontFallbacks.join(', ')}`
          );
          resolve();
        } else {
          // Load Inter from Google Fonts with error handling
          const link = document.createElement('link');
          link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
          link.rel = 'stylesheet';
          link.crossOrigin = 'anonymous';
          
          link.onload = () => {
            clearTimeout(timeout);
            document.documentElement.style.setProperty(
              '--font-family-primary', 
              `Inter, ${fontFallbacks.join(', ')}`
            );
            resolve();
          };
          
          link.onerror = () => {
            clearTimeout(timeout);
            console.warn('Failed to load Inter font, using fallback');
            resolve();
          };
          
          document.head.appendChild(link);
        }
      } catch (error) {
        clearTimeout(timeout);
        console.warn('Font check failed:', error);
        resolve();
      }
    } else {
      clearTimeout(timeout);
      resolve();
    }
  });
};

// Font loading with Android-specific handling
export const initializeFonts = () => {
  const isOldAndroid = /Android [1-9]\./.test(navigator.userAgent) || 
                      /Android 10/.test(navigator.userAgent);
  
  if (isOldAndroid) {
    console.log('Old Android detected, using system fonts only');
    document.documentElement.style.setProperty(
      '--font-family-primary', 
      'system-ui, -apple-system, Roboto, sans-serif'
    );
    return Promise.resolve();
  }
  
  return loadFontsGracefully();
};