/**
 * Android Safe Mode - Simplified app version for older devices
 * Minimal functionality to ensure app works on Android 10 and below
 */

// Detect if device needs safe mode
export const needsSafeMode = () => {
  const userAgent = navigator.userAgent;
  const androidMatch = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  return androidMatch && parseFloat(androidMatch[1]) <= 10;
};

// Check if user wants to force full version
export const shouldForceFullVersion = () => {
  return localStorage.getItem('force-full-version') === 'true';
};

// Create safe mode app using plain HTML (no React/JSX)
export const createSafeModeApp = () => {
  console.log('🛡️ Creating safe mode app for older Android device');
  
  // Clear any existing content
  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return false;
  }
  
  // Remove loading screen
  const loadingScreen = document.getElementById('initial-loading');
  if (loadingScreen) {
    loadingScreen.remove();
  }
  
  // Apply safe mode styles
  document.body.classList.add('android-safe-mode');
  document.body.style.fontFamily = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
  
  // Set safe CSS variables
  const safeFonts = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
  document.documentElement.style.setProperty('--font-family-primary', safeFonts);
  document.documentElement.style.setProperty('--font-family-fallback', safeFonts);
  
  // Create safe mode HTML
  root.innerHTML = `
    <div style="
      font-family: system-ui, -apple-system, Roboto, Arial, sans-serif;
      min-height: 100vh;
      background: white;
      padding: 20px;
    ">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        text-align: center;
      ">
        <h1 style="
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        ">
          Mobileuurka - Safe Mode
        </h1>
        
        <div style="
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: left;
        ">
          <h3 style="margin: 0 0 10px 0; color: #856404;">
            ⚠️ Compatibility Mode Active
          </h3>
          <p style="margin: 0; color: #856404; font-size: 14px;">
            Your device is running in safe mode for optimal performance. 
            Some features may be limited to ensure stability.
          </p>
        </div>
        
        <div style="
          display: grid;
          gap: 15px;
          margin-bottom: 30px;
        ">
          <button onclick="window.location.href='/auth'" style="
            padding: 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-family: inherit;
          ">
            Login / Sign Up
          </button>
          
          <button onclick="window.location.href='/'" style="
            padding: 15px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-family: inherit;
          ">
            Go to Dashboard
          </button>
        </div>
        
        <div style="
          border-top: 1px solid #ddd;
          padding-top: 20px;
          font-size: 14px;
          color: #666;
        ">
          <p><strong>Safe Mode Features:</strong></p>
          <ul style="
            text-align: left;
            max-width: 400px;
            margin: 10px auto;
            padding-left: 20px;
          ">
            <li>Optimized for older Android devices</li>
            <li>Reduced memory usage</li>
            <li>Simplified interface</li>
            <li>Essential functionality only</li>
          </ul>
          
          <button onclick="
            localStorage.setItem('force-full-version', 'true');
            window.location.reload();
          " style="
            padding: 8px 16px;
            background-color: transparent;
            color: #007bff;
            border: 1px solid #007bff;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            margin-top: 15px;
          ">
            Switch to Full Version (Not Recommended)
          </button>
        </div>
      </div>
    </div>
  `;
  
  console.log('✅ Safe mode app created successfully');
  return true;
};