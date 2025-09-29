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

// CRITICAL: Load emergency font fix FIRST
import "./utils/emergencyFontFix.js";

// Load polyfills for older browsers
import "./utils/polyfills.js";
import "./utils/androidFontFix.js";
import "./utils/fontTest.js";
import { checkBrowserCompatibility, showCompatibilityWarning } from "./utils/browserCheck.js";
import { initializeFonts } from "./utils/fontLoader.js";
import { isOldAndroid } from "./utils/androidFontFix.js";

// Check browser compatibility
const compatibility = checkBrowserCompatibility();
if (!compatibility.isCompatible) {
  showCompatibilityWarning(compatibility.warnings);
}

// Initialize fonts safely and render app
const initializeApp = async () => {
  try {
    // Skip font loading entirely for old Android devices
    if (isOldAndroid()) {
      console.log('Old Android detected, using system fonts only');
      document.body.classList.add('font-fallback', 'android-safe-mode');
      
      // Ensure no fonts are loaded
      const fontLinks = document.querySelectorAll('link[href*="font"]');
      fontLinks.forEach(link => link.remove());
      
      // Set safe fonts immediately
      const safeFonts = 'system-ui, -apple-system, Roboto, Arial, sans-serif';
      document.documentElement.style.setProperty('--font-family-primary', safeFonts);
      document.documentElement.style.setProperty('--font-family-fallback', safeFonts);
      
    } else {
      await initializeFonts();
      document.body.classList.add('font-loaded');
    }
  } catch (error) {
    console.warn('Font initialization failed:', error);
    document.body.classList.add('font-fallback');
    
    // Apply emergency fallback
    const emergencyFonts = 'Arial, Helvetica, sans-serif';
    document.documentElement.style.setProperty('--font-family-primary', emergencyFonts);
    document.documentElement.style.setProperty('--font-family-fallback', emergencyFonts);
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

// Global error handler for font-related errors
window.addEventListener('error', (event) => {
  const isFontError = event.message && (
    event.message.includes('font') ||
    event.message.includes('CFF') ||
    event.message.includes('OTS parsing error') ||
    event.message.includes('Invalid font data') ||
    event.message.includes('Failed to parse table')
  );
  
  if (isFontError) {
    console.warn('Font loading error detected, applying emergency fallback');
    
    // Remove problematic classes
    document.body.classList.remove('font-loading');
    
    // Add emergency fallback
    document.body.classList.add('emergency-font-fallback');
    
    // Set safe fonts
    const emergencyFonts = 'Arial, Helvetica, sans-serif';
    document.documentElement.style.setProperty('--font-family-primary', emergencyFonts);
    document.documentElement.style.setProperty('--font-family-fallback', emergencyFonts);
    
    // Remove any font links
    const fontLinks = document.querySelectorAll('link[href*="font"]');
    fontLinks.forEach(link => link.remove());
    
    event.preventDefault();
    return false;
  }
});

// Additional handler for unhandled promise rejections related to fonts
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && 
      event.reason.message.includes('font')) {
    console.warn('Font promise rejection, applying fallback');
    document.body.classList.add('emergency-font-fallback');
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

// Start app immediately
startApp();

// Fallback timeout - force start after 3 seconds if nothing happens
setTimeout(() => {
  if (document.getElementById('initial-loading')) {
    console.warn('App startup timeout, forcing initialization');
    startApp();
  }
}, 3000);
