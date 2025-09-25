import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
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
import { checkBrowserCompatibility, showCompatibilityWarning } from "./utils/browserCheck.js";

// Check browser compatibility
const compatibility = checkBrowserCompatibility();
if (!compatibility.isCompatible) {
  showCompatibilityWarning(compatibility.warnings);
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
