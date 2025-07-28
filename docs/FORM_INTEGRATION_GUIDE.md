# Form Integration Guide

> **Purpose**: Step-by-step guide for implementing consistent form patterns  
> **Prerequisites**: React basics, form handling concepts  
> **Estimated Reading Time**: 30 minutes

This comprehensive guide shows how to integrate forms with the SuccessMessage component, implement validation, handle errors, and follow consistent patterns across the application.

## Table of Contents
1. [Basic Form Setup](#basic-form-setup)
2. [SuccessMessage Integration](#successmessage-integration)
3. [Form Validation Patterns](#form-validation-patterns)
4. [Error Handling](#error-handling)
5. [Multi-Step Forms](#multi-step-forms)
6. [Patient Data Integration](#patient-data-integration)
7. [Troubleshooting](#troubleshooting)
8. [Complete Examples](#complete-examples)

## Basic Form Setup

### 1. Import Required Components

```jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";
```

### 2. Initialize Form State

```jsx
const YourFormComponent = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    // ... other form fields
  });
  
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;
```

### 3. Create Clear Form Function

```jsx
  // Clear form function - resets all form fields to initial state
  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      // ... reset other fields to initial values
    });
    setGrid(0); // reset to first grid if using multi-step form
    setPatientName(""); // reset any derived state
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
```

## SuccessMessage Integration

### Remove Old Success State

```jsx
// REMOVE THIS:
const [success, setSuccess] = useState(false);

// REPLACE WITH: (already done in step 3)
const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
```

### Update Form Submission Handler

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch(`${SERVER}/your-endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Submission failed");
    }

    const result = await response.json();
    console.log("Form submitted:", result);
    
    // REPLACE setSuccess(true) WITH:
    showSuccessMessage({
      title: "Success Title!",
      message: `Custom success message with ${formData.someField}`,
      showRedoButton: true,
      showScreeningButton: true, // optional
      showNextButton: true, // optional
      nextButtonText: "Add Another", // optional
      nextButtonAction: () => {
        clearForm(); // This will clear form and hide success message
      },
      patientId: formData.patientId
    });
    
  } catch (error) {
    console.error("Error submitting form:", error);
    alert(error.message || "Failed to submit form. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

### Add SuccessMessage to JSX

```jsx
return (
  <div className="form">
    {showSuccess && <SuccessMessage {...successConfig} />}
    <form onSubmit={handleSubmit} className="form-container">
      {/* your form content */}
    </form>
  </div>
);
```

### Remove Old Success Button

```jsx
// REMOVE THIS:
{success && (
  <div className="button primary" onClick={() => setInternalTab(0)}>
    Back to Patient
  </div>
)}
```

## Form Validation Patterns

### Basic Field Validation

```jsx
const validateForm = () => {
  const requiredFields = ['patientId', 'date', 'gestationweek'];
  const emptyFields = [];
  
  requiredFields.forEach(field => {
    if (!formData[field] || formData[field].toString().trim() === '') {
      emptyFields.push(field);
    }
  });

  if (emptyFields.length > 0) {
    alert(`Please fill in all required fields. Missing: ${emptyFields.join(', ')}`);
    return false;
  }
  return true;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate before submission
  if (!validateForm()) {
    return;
  }
  
  setLoading(true);
  // ... rest of submission logic
};
```

### Numeric Field Transformation

```jsx
const transformFormDataForSubmission = (data) => {
  const numericFields = [
    'gestationweek', 'heartRate', 'systolic', 'diastolic', 'weight', 'height'
  ];

  const transformedData = { ...data };

  numericFields.forEach(field => {
    const value = transformedData[field];
    if (value && value.toString().toLowerCase() !== 'unknown') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        transformedData[field] = numValue;
      }
    }
  });

  return transformedData;
};
```

### Real-time Validation

```jsx
const handleChange = (e) => {
  const { name, value, type } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === "number" ? parseInt(value) || 0 : value,
  }));

  // Real-time patient validation
  if (name === "patientId" && value) {
    fetchPatientName(value);
  } else if (name === "patientId" && !value) {
    setPatientName("");
  }
};
```

## Error Handling

### API Error Handling

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch(`${SERVER}/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Submission failed");
    }

    const result = await response.json();
    // Success handling...
    
  } catch (error) {
    console.error("Error submitting form:", error);
    alert(error.message || "Failed to submit form. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

### Patient Fetch Error Handling

```jsx
const fetchPatientName = async (patientId) => {
  if (!patientId) return;

  setFetchingPatient(true);
  try {
    const response = await fetch(`${SERVER}/patients/${patientId}`, {
      credentials: "include",
    });

    if (response.ok) {
      const patient = await response.json();
      setPatientName(patient.name || "Unknown Patient");
    } else {
      setPatientName("Patient not found");
    }
  } catch (error) {
    console.error("Error fetching patient:", error);
    setPatientName("Error fetching patient");
  } finally {
    setFetchingPatient(false);
  }
};
```

### Visual Error Indicators

```jsx
<div className="form-group">
  <label>Patient Name</label>
  <input
    type="text"
    value={fetchingPatient ? "Fetching..." : patientName}
    readOnly
    className="read-only-field"
    style={{
      background: patientName === "Patient not found" ? "#ffe6e6" : "#f8f9fa",
      color: patientName === "Patient not found" ? "#d32f2f" : "inherit",
    }}
  />
</div>
```

## Multi-Step Forms

### Grid Navigation Pattern

```jsx
const [grid, setGrid] = useState(0);

// In your JSX:
<div className="form-navigation">
  {grid !== 0 && (
    <div className="button" onClick={() => setGrid(grid - 1)}>
      Previous
    </div>
  )}
  {grid === 0 && (
    <div className="button" onClick={() => setGrid(grid + 1)}>
      Next
    </div>
  )}
  {grid === 1 && (
    <button type="submit" className="button primary" disabled={loading}>
      {loading ? <div className="spinner"></div> : "Submit"}
    </button>
  )}
</div>
```

### Conditional Grid Rendering

```jsx
<div className="form-grid-group">
  {grid === 0 && (
    <div className="form-grid">
      <div className="column-1">
        {/* First column fields */}
      </div>
      <div className="column-2">
        {/* Second column fields */}
      </div>
    </div>
  )}
  
  {grid === 1 && (
    <div className="form-grid">
      {/* Second step fields */}
    </div>
  )}
</div>
```

## Patient Data Integration

### Auto-populate Editor Field

```jsx
useEffect(() => {
  setFormData((prev) => ({
    ...prev,
    editor: currentUser?.name || "",
    patientId: selectedPatientId || "",
  }));

  if (selectedPatientId) {
    fetchPatientName(selectedPatientId);
  }
}, [currentUser, selectedPatientId]);
```

### Calculated Fields

```jsx
// Calculate BMI when height or weight changes
useEffect(() => {
  if (formData.height > 0 && formData.weight > 0) {
    const heightInMeters = formData.height / 100;
    const bmi = Math.round((formData.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    setFormData((prev) => ({ ...prev, bmi }));
  }
}, [formData.height, formData.weight]);

// Calculate MAP when systolic and diastolic change
useEffect(() => {
  if (formData.systolic > 0 && formData.diastolic > 0) {
    const map = Math.round(formData.diastolic + (formData.systolic - formData.diastolic) / 3);
    setFormData((prev) => ({ ...prev, map }));
  }
}, [formData.systolic, formData.diastolic]);
```

### Auto-split Name Fields

```jsx
const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => {
    const updated = { ...prev, [name]: value };

    // Auto-split full name into first/last names
    if (name === "name") {
      const [firstName, ...lastNameParts] = value.split(" ");
      updated.firstName = firstName || "";
      updated.lastName = lastNameParts.join(" ") || "";
    }

    return updated;
  });
};
```

## Troubleshooting

### Common Issues and Solutions

#### 1. SuccessMessage Not Showing
**Problem**: Success message doesn't appear after form submission
**Solution**: 
- Ensure `{showSuccess && <SuccessMessage {...successConfig} />}` is in your JSX
- Check that `showSuccessMessage()` is called in the success block
- Verify the hook is properly initialized: `const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);`

#### 2. Form Not Clearing After Success
**Problem**: Form fields retain values after "Do Again" is clicked
**Solution**:
- Ensure your `clearForm` function resets all form fields
- Check that `clearForm` is passed to `useSuccessMessage(clearForm)`
- Verify all state variables are reset in `clearForm`

#### 3. Patient Name Not Loading
**Problem**: Patient name shows "Error fetching patient" or doesn't load
**Solution**:
- Check network connectivity and server status
- Verify the patient ID is valid and exists in the database
- Check browser console for API errors
- Ensure credentials are included in the fetch request

#### 4. Validation Errors
**Problem**: Form submits with invalid data
**Solution**:
- Add client-side validation before submission
- Check required field validation logic
- Ensure numeric fields are properly transformed
- Add server-side validation as backup

#### 5. Loading State Issues
**Problem**: Loading spinner doesn't show or gets stuck
**Solution**:
- Ensure `setLoading(true)` is called at the start of submission
- Always call `setLoading(false)` in the `finally` block
- Check for unhandled promise rejections

### Debugging Tips

1. **Check Console Logs**: Always check browser console for errors
2. **Network Tab**: Monitor API calls in browser dev tools
3. **State Inspection**: Use React DevTools to inspect component state
4. **Error Boundaries**: Implement error boundaries for better error handling

## Complete Examples

### Simple Form Example

```jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const SimpleForm = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      editor: currentUser?.name || "",
    }));
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${SERVER}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Submission failed");

      showSuccessMessage({
        title: "Note Saved Successfully!",
        message: "Your note has been saved.",
        showRedoButton: true,
        patientId: formData.patientId
      });
      
    } catch (error) {
      alert(error.message || "Failed to save note. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Add Note</h2>
        
        <div className="form-group">
          <label>Patient ID *</label>
          <input
            type="text"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : "Save Note"}
        </button>
      </form>
    </div>
  );
};

export default SimpleForm;
```

### Complex Multi-Step Form Example

```jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import { FiChevronDown } from "react-icons/fi";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const ComplexForm = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    date: new Date().toISOString().split("T")[0],
    // Step 1 fields
    height: "",
    weight: "",
    bmi: "",
    // Step 2 fields
    systolic: "",
    diastolic: "",
    map: "",
  });
  
  const [grid, setGrid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [fetchingPatient, setFetchingPatient] = useState(false);
  
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      height: "",
      weight: "",
      bmi: "",
      systolic: "",
      diastolic: "",
      map: "",
    });
    setGrid(0);
    setPatientName("");
  };

  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);

  // Auto-calculate BMI
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      const bmi = Math.round((formData.weight / (heightInMeters * heightInMeters)) * 10) / 10;
      setFormData((prev) => ({ ...prev, bmi }));
    }
  }, [formData.height, formData.weight]);

  // Auto-calculate MAP
  useEffect(() => {
    if (formData.systolic > 0 && formData.diastolic > 0) {
      const map = Math.round(formData.diastolic + (formData.systolic - formData.diastolic) / 3);
      setFormData((prev) => ({ ...prev, map }));
    }
  }, [formData.systolic, formData.diastolic]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const validateForm = () => {
    const requiredFields = ['patientId', 'height', 'weight', 'systolic', 'diastolic'];
    const emptyFields = [];
    
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        emptyFields.push(field);
      }
    });

    if (emptyFields.length > 0) {
      alert(`Please fill in all required fields. Missing: ${emptyFields.join(', ')}`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch(`${SERVER}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }

      showSuccessMessage({
        title: "Vitals Recorded Successfully!",
        message: `Vital signs recorded for ${patientName || 'the patient'}.`,
        showRedoButton: true,
        showScreeningButton: true,
        patientId: formData.patientId
      });
      
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message || "Failed to submit form. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}
      <form onSubmit={handleSubmit} className="form-container">
        <h2>Vital Signs</h2>

        <div className="form-grid-group">
          {grid === 0 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Height (cm) *</label>
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Weight (kg) *</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>BMI (calculated)</label>
                  <input
                    type="number"
                    value={formData.bmi}
                    readOnly
                    className="read-only-field"
                  />
                </div>
              </div>
            </div>
          )}

          {grid === 1 && (
            <div className="form-grid">
              <div className="column-1">
                <div className="form-group">
                  <label>Systolic (mmHg) *</label>
                  <input
                    type="number"
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Diastolic (mmHg) *</label>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="column-2">
                <div className="form-group">
                  <label>MAP (calculated)</label>
                  <input
                    type="number"
                    value={formData.map}
                    readOnly
                    className="read-only-field"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-navigation">
          {grid !== 0 && (
            <div className="button" onClick={() => setGrid(grid - 1)}>
              Previous
            </div>
          )}
          {grid === 0 && (
            <div className="button" onClick={() => setGrid(grid + 1)}>
              Next
            </div>
          )}
          {grid === 1 && (
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : "Submit"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ComplexForm;
```

## SuccessMessage Configuration Options

```jsx
showSuccessMessage({
  title: "Custom Title", // default: "Success!"
  message: "Custom message", // default: "Your action was completed successfully."
  showRedoButton: true, // default: true - shows "Do Again" button
  showScreeningButton: false, // default: false - shows "Go to Screening" button
  showNextButton: true, // default: false - shows custom next button
  nextButtonText: "Add Another", // default: "Next"
  nextButtonAction: () => {
    // Custom action for next button
    clearForm();
    setInternalTab(2.2); // Navigate to specific tab
  },
  patientId: formData.patientId // for navigation back to patient
});
```

## Quick Reference

### Essential Form Setup

| Step | Code | Guide Section |
|------|------|---------------|
| **1. Import Hook** | `import useSuccessMessage from "../hooks/useSuccessMessage";` | [Basic Form Setup](#basic-form-setup) |
| **2. Initialize Hook** | `const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);` | [SuccessMessage Integration](#successmessage-integration) |
| **3. Add JSX** | `{showSuccess && <SuccessMessage {...successConfig} />}` | [SuccessMessage Integration](#successmessage-integration) |
| **4. Show Success** | `showSuccessMessage({ title: "Success!", message: "Done!" });` | [SuccessMessage Integration](#successmessage-integration) |

### Form Patterns Cheat Sheet

```javascript
// Basic form state
const [formData, setFormData] = useState({
  patientId: selectedPatientId || "",
  editor: "",
  date: new Date().toISOString().split("T")[0],
});

// Handle input changes
const handleChange = (e) => {
  const { name, value, type } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: type === "number" ? parseInt(value) || 0 : value
  }));
};

// Form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await fetch(`${SERVER}/endpoint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error("Submission failed");
    showSuccessMessage({ title: "Success!", message: "Form submitted!" });
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Common Form Configurations

| Form Type | Success Config | Use Case |
|-----------|----------------|----------|
| **Simple Form** | `{ title: "Saved!", showRedoButton: true }` | Basic data entry |
| **Patient Form** | `{ title: "Patient Updated!", showScreeningButton: true, patientId }` | Patient data |
| **Multi-step** | `{ title: "Complete!", showNextButton: true, nextButtonText: "Add Another" }` | Complex workflows |

### Troubleshooting Quick Fixes

| Issue | Quick Fix | Detailed Section |
|-------|-----------|------------------|
| **Success Not Showing** | Check `{showSuccess && <SuccessMessage {...successConfig} />}` | [Troubleshooting](#troubleshooting) |
| **Form Not Clearing** | Verify `clearForm` function resets all fields | [Troubleshooting](#troubleshooting) |
| **Patient Not Loading** | Check `fetchPatientName` function and API endpoint | [Troubleshooting](#troubleshooting) |
| **Validation Failing** | Add client-side validation before submission | [Form Validation Patterns](#form-validation-patterns) |

## Benefits

1. **Consistent UX**: All forms have the same success experience
2. **Easy Form Reset**: "Do Again" button automatically clears the form
3. **Flexible Navigation**: Options to go to screening, add another, or back to patient
4. **Reusable**: One hook works for all forms
5. **Customizable**: Each form can customize the success message and buttons
6. **Error Handling**: Comprehensive error handling patterns
7. **Validation**: Built-in validation patterns for common scenarios
8. **Patient Integration**: Seamless integration with patient data
#
# Related Documentation

### Essential Reading
- **[Redux Integration Guide](REDUX_INTEGRATION.md)** - Managing form state with Redux (see [Form State Management](REDUX_INTEGRATION.md#form-state-management))
- **[Socket Integration Guide](SOCKET_INTEGRATION.md)** - Real-time form updates and data synchronization (see [Real-time Data Updates](SOCKET_INTEGRATION.md#real-time-data-synchronization))

### Complementary Guides
- **[AI Chatbot Guide](AI_CHATBOT_GUIDE.md)** - Form-like chat interface patterns
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Form validation in production environments

### Cross-Reference Quick Links
| Topic | This Guide Section | Related Guide Section |
|-------|-------------------|----------------------|
| **State Management** | [Patient Data Integration](#patient-data-integration) | [Redux Integration Guide](REDUX_INTEGRATION.md#state-management-for-real-time-updates) |
| **Real-time Updates** | [Real-time Form Updates](#real-time-form-updates) | [Socket Integration Guide](SOCKET_INTEGRATION.md#socket-events-and-real-time-data-synchronization) |
| **Error Handling** | [Error Handling](#error-handling) | [Socket Error Handling](SOCKET_INTEGRATION.md#error-handling) |
| **Validation Patterns** | [Form Validation Patterns](#form-validation-patterns) | [API Validation](DEPLOYMENT_GUIDE.md#api-validation) |

---

This guide provides comprehensive coverage of form integration patterns in MobileUurka. For additional support or questions, please refer to the troubleshooting section or create an issue in the project repository.