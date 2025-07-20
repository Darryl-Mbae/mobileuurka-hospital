# SuccessMessage Integration Guide

This guide shows how to integrate the SuccessMessage component into any form in the application.

## 1. Import Required Components

```jsx
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";
```

## 2. Create Clear Form Function

```jsx
const YourFormComponent = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    // your initial form data
  });
  
  // Clear form function - resets all form fields to initial state
  const clearForm = () => {
    setFormData({
      // reset to initial values
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      date: new Date().toISOString().split("T")[0],
      // ... other initial values
    });
    setGrid(0); // reset to first grid if using multi-step form
    // reset any other form-related state
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
```

## 3. Remove Old Success State

```jsx
// REMOVE THIS:
const [success, setSuccess] = useState(false);

// REPLACE WITH: (already done in step 2)
const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);
```

## 4. Update Form Submission Handler

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

## 5. Add SuccessMessage to JSX

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

## 6. Remove Old Success Button

```jsx
// REMOVE THIS:
{success && (
  <div className="button primary" onClick={() => setInternalTab(0)}>
    Back to Patient
  </div>
)}
```

## Complete Example

```jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "../css/Form.css";
import SuccessMessage from "../components/SuccessMessage";
import useSuccessMessage from "../hooks/useSuccessMessage";

const YourForm = ({ setInternalTab, selectedPatientId }) => {
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || "",
    editor: "",
    // ... other fields
  });
  
  const [loading, setLoading] = useState(false);
  const currentUser = useSelector((s) => s.user.currentUser);
  const SERVER = import.meta.env.VITE_SERVER_URL;

  // Clear form function
  const clearForm = () => {
    setFormData({
      patientId: selectedPatientId || "",
      editor: currentUser?.name || "",
      // ... reset other fields
    });
  };

  // Use success message hook
  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage(clearForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // API call
      const response = await fetch(`${SERVER}/endpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Submission failed");

      showSuccessMessage({
        title: "Form Submitted Successfully!",
        message: "Your data has been saved.",
        showRedoButton: true,
        patientId: formData.patientId
      });
      
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}
      <form onSubmit={handleSubmit} className="form-container">
        {/* form content */}
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default YourForm;
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
  },
  patientId: formData.patientId // for navigation back to patient
});
```

## Benefits

1. **Consistent UX**: All forms have the same success experience
2. **Easy Form Reset**: "Do Again" button automatically clears the form
3. **Flexible Navigation**: Options to go to screening, add another, or back to patient
4. **Reusable**: One hook works for all forms
5. **Customizable**: Each form can customize the success message and buttons