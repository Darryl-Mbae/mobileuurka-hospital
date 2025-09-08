# Screening Flow System Documentation

## Overview
The screening flow system provides a configurable way to guide users through sequential medical forms with progress tracking and automatic navigation.

## Key Features
- ✅ **Configurable Flows**: Easy to modify screening sequences
- ✅ **Progress Tracking**: Visual progress indicators
- ✅ **Automatic Navigation**: Smart routing between forms
- ✅ **Patient Context**: Maintains patient ID across forms
- ✅ **Flexible Steps**: Required vs optional steps
- ✅ **Multiple Flows**: Different flows for different scenarios

## Configuration

### 1. Screening Flow Configuration (`src/config/screeningFlowConfig.js`)

This is the main configuration file where you define your screening flows:

```javascript
export const SCREENING_FLOWS = {
  PATIENT_SCREENING: {
    id: 'patient_screening',
    name: 'Patient Screening Flow',
    steps: [
      {
        id: 'intake',
        name: 'Patient Intake',
        component: 'PatientIntake',
        description: 'Basic patient registration',
        icon: '📝',
        required: true
      },
      // ... more steps
    ]
  }
};
```

### 2. Available Flows

#### **PATIENT_SCREENING** (Default)
Complete patient assessment from intake to diagnosis:
1. Patient Intake (Required) 📝
2. Patient Visit (Required) 🏥  
3. Triage (Required) 🩺
4. Patient History (Optional) 📋
5. Lifestyle Assessment (Optional) 🏃‍♀️

#### **PREGNANCY_SCREENING**
Comprehensive pregnancy assessment:
1. Patient Intake (Required) 📝
2. Pregnancy Assessment (Required) 🤱
3. Triage (Required) 🩺
4. Ultrasound (Optional) 🔍
5. Lab Work (Optional) 🧪

#### **QUICK_ASSESSMENT**
Streamlined assessment for follow-up visits:
1. Patient Visit (Required) 🏥
2. Triage (Required) 🩺

## Implementation Guide

### 1. Adding the Flow to a Form

```javascript
// Import the hook
import { useScreeningFlow } from "../hooks/useScreeningFlow";

// In your component
const MyForm = ({ setInternalTab }) => {
  const { navigateToNextStep, getCurrentStepInfo } = useScreeningFlow(setInternalTab);
  const screeningInfo = getCurrentStepInfo('MyFormComponent');

  // In your success message
  showSuccessMessage({
    title: "Form Completed Successfully!",
    message: "Your form has been submitted.",
    showNextScreening: true,
    flowId: screeningInfo.flowId,
    currentStepId: screeningInfo.stepId,
    patientId: formData.patientId,
    onNextScreening: navigateToNextStep,
  });
};
```

### 2. Component Name Mapping

Make sure your component name matches the mapping in `useScreeningFlow.js`:

```javascript
const componentToTabMap = {
  'PatientIntake': 'PatientIntake',
  'PatientVisit': 'PatientVisit', 
  'Triage': 'Triage',
  'PatientHistory': 'PatientHistory',
  'Lifestyle': 'Lifestyle',
  // Add your new components here
};
```

## Customization

### 1. Changing Flow Order

To change the order of forms, simply reorder the steps in `screeningFlowConfig.js`:

```javascript
steps: [
  { id: 'triage', name: 'Triage', component: 'Triage', ... },      // Now first
  { id: 'intake', name: 'Patient Intake', component: 'PatientIntake', ... }, // Now second
  // ...
]
```

### 2. Adding New Forms

1. **Add to configuration**:
```javascript
{
  id: 'new_form',
  name: 'New Assessment',
  component: 'NewAssessment',
  description: 'Description of new form',
  icon: '🆕',
  required: false
}
```

2. **Add to component mapping**:
```javascript
const componentToTabMap = {
  // ... existing mappings
  'NewAssessment': 'NewAssessment',
};
```

3. **Implement in your form**:
```javascript
const NewAssessment = ({ setInternalTab }) => {
  const { navigateToNextStep, getCurrentStepInfo } = useScreeningFlow(setInternalTab);
  const screeningInfo = getCurrentStepInfo('NewAssessment');
  
  // ... your form logic
};
```

### 3. Creating New Flows

Add a new flow to `SCREENING_FLOWS`:

```javascript
CUSTOM_FLOW: {
  id: 'custom_flow',
  name: 'Custom Assessment Flow',
  description: 'Specialized assessment for specific cases',
  steps: [
    // Define your custom steps
  ]
}
```

### 4. Making Steps Optional/Required

Change the `required` property:

```javascript
{
  id: 'optional_step',
  name: 'Optional Assessment',
  component: 'OptionalForm',
  required: false  // This step can be skipped
}
```

## Best Practices

### 1. **Consistent Naming**
- Use clear, descriptive names for steps
- Keep component names consistent with file names
- Use meaningful IDs (lowercase with underscores)

### 2. **Progress Indication**
- Always show progress for multi-step flows
- Use descriptive step descriptions
- Include appropriate icons for visual clarity

### 3. **Patient Context**
- Always pass patient ID between forms
- Use session storage for temporary data
- Clear context when flow is complete

### 4. **Error Handling**
- Handle missing patient IDs gracefully
- Provide fallback navigation options
- Log navigation events for debugging

## Troubleshooting

### Common Issues

1. **Form not navigating to next step**
   - Check component name mapping in `useScreeningFlow.js`
   - Verify `setInternalTab` is passed correctly
   - Ensure step ID exists in flow configuration

2. **Patient ID not carrying over**
   - Check session storage is being set correctly
   - Verify patient ID is passed in success message
   - Ensure form is reading from screening context

3. **Progress not showing correctly**
   - Verify current step ID matches configuration
   - Check flow ID is correct
   - Ensure step exists in the specified flow

### Debugging

Enable debugging by adding console logs:

```javascript
const screeningInfo = getCurrentStepInfo('MyComponent');
console.log('Screening Info:', screeningInfo);
```

## Future Enhancements

Potential improvements to consider:

1. **Conditional Steps**: Steps that appear based on previous answers
2. **Branching Flows**: Different paths based on patient type
3. **Step Validation**: Prevent navigation if required fields missing
4. **Flow Templates**: Pre-built flows for common scenarios
5. **Analytics**: Track completion rates and drop-off points

## Example Usage

Here's a complete example of implementing the screening flow in a new form:

```javascript
import React, { useState, useEffect } from "react";
import { useScreeningFlow } from "../hooks/useScreeningFlow";
import useSuccessMessage from "../hooks/useSuccessMessage";
import SuccessMessage from "../components/SuccessMessage";

const MyNewForm = ({ setInternalTab }) => {
  const { navigateToNextStep, getCurrentStepInfo, getScreeningContext } = useScreeningFlow(setInternalTab);
  const screeningInfo = getCurrentStepInfo('MyNewForm');
  const screeningContext = getScreeningContext();
  
  const [formData, setFormData] = useState({
    patientId: screeningContext.patientId || "",
    // ... other fields
  });

  const { showSuccess, successConfig, showSuccessMessage } = useSuccessMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Submit your form data
      const response = await submitForm(formData);
      
      // Show success with next screening step
      showSuccessMessage({
        title: "Assessment Completed!",
        message: "Your assessment has been recorded successfully.",
        showNextScreening: true,
        flowId: screeningInfo.flowId,
        currentStepId: screeningInfo.stepId,
        patientId: formData.patientId,
        onNextScreening: navigateToNextStep,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="form">
      {showSuccess && <SuccessMessage {...successConfig} />}
      
      <form onSubmit={handleSubmit}>
        {/* Your form fields */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default MyNewForm;
```

This system makes it easy to create guided, sequential workflows while maintaining flexibility for different screening scenarios.