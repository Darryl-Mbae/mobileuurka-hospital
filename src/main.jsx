import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import "./css/AndroidPerformance.css";
import App from "./App.jsx";
import Auth from "./pages/Auth.jsx";
import store from "./config/store.js";
import { Provider } from "react-redux";
import FormTemplate from "./components/FormTemplate.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

// Enhanced Android crash fixes - load first
import { initAndroidCrashFix, shouldEnableSafeMode, enableSafeMode } from "./utils/androidCrashFix.js";
import { initRecaptchaErrorHandling } from "./utils/recaptchaWrapper.js";
import { initEmergencyPatientFix } from "./utils/emergencyPatientFix.js";
import "./utils/simpleAndroidFix.js";

// Initialize crash fixes immediately
initAndroidCrashFix();
initRecaptchaErrorHandling();
initEmergencyPatientFix();

// Check if safe mode should be enabled
if (shouldEnableSafeMode()) {
  console.warn('Extremely old/slow device detected, enabling safe mode');
  enableSafeMode();
}

// Simple font error handler
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('font') || e.message.includes('CFF') || e.message.includes('OTS'))) {
    console.log('Font error blocked');
    e.stopPropagation();
    e.preventDefault();
    return false;
  }
}, true);

// Set safe fonts immediately
document.documentElement.style.setProperty('--font-family-primary', 'system-ui, -apple-system, Roboto, Arial, sans-serif');
document.documentElement.style.setProperty('--font-family-fallback', 'system-ui, -apple-system, Roboto, Arial, sans-serif');

// Simple app initialization
const initApp = () => {
  // Remove loading screen
  const loading = document.getElementById('initial-loading');
  if (loading) loading.remove();
  
  // Render app
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

// Start app immediately
initApp();

// Backup timeout - increased for slow devices
setTimeout(() => {
  if (document.getElementById('initial-loading')) {
    console.log('Backup timeout triggered');
    initApp();
  }
}, 10000); // 10 seconds timeout
