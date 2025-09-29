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
    // Skip font loading for old Android devices
    if (isOldAndroid()) {
      console.log('Old Android detected, skipping font loading');
      document.body.classList.add('font-fallback');
    } else {
      await initializeFonts();
      document.body.classList.add('font-loaded');
    }
  } catch (error) {
    console.warn('Font initialization failed:', error);
    document.body.classList.add('font-fallback');
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

// Initialize the app
initializeApp();
