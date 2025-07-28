# OutdatedDialog Usage Guide

The OutdatedDialog system works similarly to the SuccessMessage pattern you're already familiar with.

## Basic Setup

### 1. Import the components and hook

```jsx
import OutdatedDialog from "../components/Outdated";
import useOutdatedDialog from "../hooks/useOutdatedDialog";
```

### 2. Initialize the hook

```jsx
const { showDialog, dialogConfig, showOutdatedDialog } = useOutdatedDialog();
```

### 3. Add the dialog to your JSX

```jsx
return (
  <div className="form">
    {showDialog && <OutdatedDialog {...dialogConfig} />}
    {/* Your form content */}
  </div>
);
```

## Usage Examples

### Basic Dialog

```jsx
const handleBasicDialog = async () => {
  const result = await showOutdatedDialog({
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
    confirmText: "Yes",
    cancelText: "No"
  });
  
  if (result) {
    // User confirmed
    console.log("User confirmed");
  } else {
    // User cancelled
    console.log("User cancelled");
  }
};
```

### Data Validation Dialog (like in Labwork)

```jsx
const validateDataAge = async (patient, maxAgeInDays = 7) => {
  const outdated = [];
  
  // Check various data ages
  if (!isRecent(patient.lastVitals?.date, maxAgeInDays)) {
    outdated.push("Vital signs");
  }
  if (!isRecent(patient.lastLabwork?.date, maxAgeInDays)) {
    outdated.push("Lab results");
  }
  
  if (outdated.length > 0) {
    const proceed = await showOutdatedDialog({
      title: "Outdated Data Warning",
      message: `The following data is more than ${maxAgeInDays} days old:\n- ${outdated.join("\n- ")}\n\nThis may affect accuracy. Do you want to proceed?`,
      confirmText: "Proceed Anyway",
      cancelText: "Update Data First"
    });
    
    return proceed;
  }
  
  return true; // No outdated data, proceed
};

// Usage in form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const canProceed = await validateDataAge(patient);
  if (!canProceed) {
    return; // User chose to update data first
  }
  
  // Continue with form submission
  submitForm();
};
```

### Custom Styling Dialog

```jsx
const handleCustomDialog = async () => {
  const result = await showOutdatedDialog({
    title: "Custom Warning",
    message: "This action cannot be undone.\nAre you absolutely sure?",
    confirmText: "Delete Forever",
    cancelText: "Keep Safe",
    showCloseButton: false // Hide the X button
  });
  
  if (result) {
    // Perform destructive action
  }
};
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | "Outdated Data" | Dialog title |
| `message` | string | "Some data may be outdated." | Dialog message (supports \n for line breaks) |
| `confirmText` | string | "Proceed Anyway" | Confirm button text |
| `cancelText` | string | "Cancel" | Cancel button text |
| `showCloseButton` | boolean | true | Show/hide the X close button |

## Integration with Forms

### Pattern 1: Pre-submission Validation

```jsx
const MyForm = () => {
  const { showDialog, dialogConfig, showOutdatedDialog } = useOutdatedDialog();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for issues before submission
    const hasIssues = checkForDataIssues();
    
    if (hasIssues) {
      const proceed = await showOutdatedDialog({
        title: "Data Quality Warning",
        message: "Some data quality issues were detected.\nProceed anyway?",
        confirmText: "Submit Anyway",
        cancelText: "Review Data"
      });
      
      if (!proceed) return;
    }
    
    // Submit form
    await submitForm();
  };
  
  return (
    <div className="form">
      {showDialog && <OutdatedDialog {...dialogConfig} />}
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  );
};
```

### Pattern 2: Conditional Field Updates

```jsx
const handleFieldChange = async (fieldName, value) => {
  // If changing a critical field, warn about implications
  if (fieldName === 'diagnosis' && existingDiagnosis) {
    const proceed = await showOutdatedDialog({
      title: "Change Diagnosis",
      message: "Changing the diagnosis will affect all related calculations.\nContinue?",
      confirmText: "Change Diagnosis",
      cancelText: "Keep Current"
    });
    
    if (!proceed) return;
  }
  
  // Update the field
  setFormData(prev => ({ ...prev, [fieldName]: value }));
};
```

## Comparison with SuccessMessage

| Feature | SuccessMessage | OutdatedDialog |
|---------|----------------|----------------|
| **Purpose** | Show success after action | Get user confirmation before action |
| **User Interaction** | Informational (optional actions) | Required choice (confirm/cancel) |
| **Return Value** | None | Promise<boolean> |
| **Timing** | After form submission | Before form submission |
| **Icon** | Checkmark (success) | Warning (caution) |

## Best Practices

1. **Use for Data Quality Issues**: Perfect for warning about outdated, missing, or questionable data
2. **Clear Messaging**: Explain the implications of proceeding
3. **Specific Action Buttons**: Use descriptive button text ("Update Data First" vs "Cancel")
4. **Don't Overuse**: Only show for genuinely important decisions
5. **Provide Context**: Explain what data is outdated and why it matters

## Common Use Cases

- Outdated patient data before diagnosis
- Missing required information
- Data quality warnings
- Destructive actions confirmation
- Workflow interruption warnings
- Compliance or safety checks