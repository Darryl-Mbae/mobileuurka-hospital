import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import "./css/FontFixes.css";
import App from "./App.jsx";
import Auth from "./pages/Auth.jsx";
import store from "./config/store.js";
import { Provider } from "react-redux";
import FormTemplate from "./components/FormTemplate.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// CRITICAL: Load emergency font fix FIRST
import "./utils/emergencyFontFix.js";

// Load performance optimizer
import { initPerformanceOptimizations, scheduleTask, optimizedSetTimeout, throttle } from "./utils/performanceOptimizer.js";

// Load polyfills for older browsers
import "./utils/polyfills.js";
import "./utils/androidFontFix.js";
import { checkBrowserCompatibility, showCompatibilityWarning } from "./utils/browserCheck.js";
import { initializeFonts } from "./utils/fontLoader.js";
import { isOldAndroid } from "./utils/androidFontFix.js";

// Ensure root element exists and is visible
const ensureRootElement = () => {
  const root = document.getElementById("root");
  if (!root) {
    console.error('Root element not found!');
    return false;
  }
  
  // Ensure root is visible
  root.style.visibility = 'visible';
  root.style.display = 'block';
  root.style.minHeight = '100vh';
  root.style.fontFamily = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
  
  return true;
};

// Check if we need safe mode FIRST
const needsSafeMode = () => {
  const userAgent = navigator.userAgent;
  const androidMatch = userAgent.match(/Android (\d+(?:\.\d+)?)/);
  return androidMatch && parseFloat(androidMatch[1]) <= 10;
};

const shouldForceFullVersion = () => {
  return localStorage.getItem('force-full-version') === 'true';
};

// If old Android and not forcing full version, use safe mode
if (needsSafeMode() && !shouldForceFullVersion()) {
  console.log('🛡️ Old Android detected, loading safe mode');
  
  // Import and create safe mode
  import("./utils/androidSafeMode.js").then(({ createSafeModeApp }) => {
    createSafeModeApp();
  });
  
  // Don't continue with normal app loading
} else {



// Initialize performance optimizations immediately
initPerformanceOptimizations();

// Check browser compatibility (scheduled to avoid blocking)
scheduleTask(() => {
  const compatibility = checkBrowserCompatibility();
  if (!compatibility.isCompatible) {
    showCompatibilityWarning(compatibility.warnings);
  }
}, 'low');

// Initialize fonts safely and render app
const initializeApp = async () => {
  try {
    // Skip font loading entirely for old Android devices
    if (isOldAndroid()) {
      console.log('Old Android detected, using system fonts only');
      
      // Schedule font cleanup to avoid blocking
      scheduleTask(() => {
        document.body.classList.add('font-fallback', 'android-safe-mode');
        
        // Remove font links in chunks
        const fontLinks = document.querySelectorAll('link[href*="font"]');
        fontLinks.forEach(link => link.remove());
        
        // Set safe fonts
        const safeFonts = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
        document.documentElement.style.setProperty('--font-family-primary', safeFonts);
        document.documentElement.style.setProperty('--font-family-fallback', safeFonts);
      }, 'high');
      
    } else {
      await initializeFonts();
      document.body.classList.add('font-loaded');
    }
  } catch (error) {
    console.warn('Font initialization failed:', error);
    
    // Schedule fallback application
    scheduleTask(() => {
      document.body.classList.add('font-fallback');
      const emergencyFonts = 'Arial, Helvetica, sans-serif';
      document.documentElement.style.setProperty('--font-family-primary', emergencyFonts);
      document.documentElement.style.setProperty('--font-family-fallback', emergencyFonts);
    }, 'high');
  }
  
  createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/form" element={<FormTemplate />} />
            <Route path="/:page" element={<App />} />
            <Route path="/:page/:id" element={<App />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
};

// Add loading class initially
document.body.classList.add('font-loading');

// Optimized error handlers (throttled to prevent performance issues)
const handleFontError = (event) => {
  const isFontError = event.message && (
    event.message.includes('font') ||
    event.message.includes('CFF') ||
    event.message.includes('OTS parsing error') ||
    event.message.includes('Invalid font data') ||
    event.message.includes('Failed to parse table')
  );
  
  if (isFontError) {
    // Schedule font fallback to avoid blocking
    scheduleTask(() => {
      console.warn('Font loading error detected, applying emergency fallback');
      
      document.body.classList.remove('font-loading');
      document.body.classList.add('emergency-font-fallback');
      
      const emergencyFonts = 'Arial, Helvetica, sans-serif';
      document.documentElement.style.setProperty('--font-family-primary', emergencyFonts);
      document.documentElement.style.setProperty('--font-family-fallback', emergencyFonts);
      
      // Remove font links in chunks to avoid blocking
      const fontLinks = document.querySelectorAll('link[href*="font"]');
      fontLinks.forEach(link => link.remove());
    }, 'high');
    
    event.preventDefault();
    return false;
  }
};

// Throttled error handlers to prevent performance issues
let errorHandlerTimeout;
window.addEventListener('error', (event) => {
  if (errorHandlerTimeout) return;
  errorHandlerTimeout = optimizedSetTimeout(() => {
    handleFontError(event);
    errorHandlerTimeout = null;
  }, 10);
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('font')) {
    scheduleTask(() => {
      console.warn('Font promise rejection, applying fallback');
      document.body.classList.add('emergency-font-fallback');
    }, 'high');
    event.preventDefault();
  }
});

// Initialize the app with timeout fallback
const startApp = () => {
  // Ensure root element is ready
  if (!ensureRootElement()) {
    console.error('Cannot start app: root element not available');
    return;
  }
  
  // Remove loading screen
  const loadingScreen = document.getElementById('initial-loading');
  if (loadingScreen) {
    loadingScreen.remove();
  }
  
  initializeApp().catch(error => {
    console.error('App initialization failed:', error);
    
    // Force render with emergency fallback
    document.body.classList.add('emergency-font-fallback');
    const emergencyFonts = 'Arial, Helvetica, sans-serif';
    document.documentElement.style.setProperty('--font-family-primary', emergencyFonts);
    
    createRoot(document.getElementById("root")).render(
      <ErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/form" element={<FormTemplate />} />
              <Route path="/:page" element={<App />} />
              <Route path="/:page/:id" element={<App />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<div>Page not found</div>} />
            </Routes>
          </BrowserRouter>
        </Provider>
      </ErrorBoundary>
    );
  });
};

// Start app with optimized scheduling
scheduleTask(() => {
  startApp();
}, 'high');

// Fallback timeout - force start after 5 seconds if nothing happens (longer for old devices)
const fallbackTimeout = isOldAndroid() ? 8000 : 3000;
optimizedSetTimeout(() => {
  if (document.getElementById('initial-loading')) {
    console.warn('App startup timeout, forcing initialization');
    scheduleTask(() => startApp(), 'high');
  }
}, fallbackTimeout);

} // End of else block for non-safe-mode devices
