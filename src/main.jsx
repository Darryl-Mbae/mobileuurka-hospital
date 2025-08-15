import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Auth from "./pages/Auth.jsx";
import store from "./config/store.js";
import { Provider } from "react-redux";
import FormTemplate from "./components/FormTemplate.jsx";




createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/form" element={<FormTemplate />} />
        <Route path="/:page" element={<App />} />
        <Route path="/:page/:id" element={<App />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  </Provider>
);
