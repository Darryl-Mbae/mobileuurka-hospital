// WhatsApp Templates Configuration
// This file contains all WhatsApp message templates with their API configurations

export const whatsappTemplatesConfig = [
  {
    id: 1,
    title: "Appointment Reminder",
    message: "Hello {{patientName}}, This is a reminder of your appointment with Dr. {{doctorName}} on {{appointmentDate}} at {{appointmentTime}}. Please confirm or reschedule below.",
    apiEndpoint: "/send/appointment-reminder",
    variables: [
      { key: "{{patientName}}", source: "patient.name", fallback: "[Patient Name]", backendKey: "patientName", alternativeSource: "patient.firstName" },
      { key: "{{doctorName}}", source: "user.name", fallback: "[Doctor Name]", backendKey: "doctorName" },
      { key: "{{appointmentDate}}", source: "patient.nextVisit", fallback: "[Date]", format: "date", backendKey: "appointmentDate" },
      { key: "{{appointmentTime}}", source: "selectedTime", fallback: "[Time]", format: "time", requiresInput: true, backendKey: "appointmentTime" }
    ],
    requiresTimeInput: true,
    category: "appointments"
  },
  {
    id: 2,
    title: "Weekly Checkup",
    message: "Hello {{patientName}}, How have you been feeling this week? Have you been having any complaints or aches?",
    apiEndpoint: "/send/appointment-reminder", // Using same endpoint for now
    variables: [
      { key: "{{patientName}}", source: "patient.name", fallback: "[Patient Name]", backendKey: "patientName" }
    ],
    requiresTimeInput: false,
    category: "checkups"
  },
  {
    id: 3,
    title: "Post Medication Checkup",
    message: "Hello {{patientName}}, We hope you're recovering well after your visit on {{visitDate}}. This is a quick check-in to see how you're feeling after starting your new medication. Have you noticed any changes in your symptoms?",
    apiEndpoint: "/send/appointment-reminder", // Using same endpoint for now
    variables: [
      { key: "{{patientName}}", source: "patient.name", fallback: "[Patient Name]", backendKey: "patientName" },
      { key: "{{visitDate}}", source: "patient.lastVisit", fallback: "[Visit Date]", format: "date", backendKey: "appointmentDate" }
    ],
    requiresTimeInput: false,
    category: "medication"
  },
  {
    id: 4,
    title: "Patient Lifestyle",
    message: "Patient Lifestyle Assessment - This will start an interactive flow to collect lifestyle information from the patient.",
    apiEndpoint: "/send/patient-lifestyle",
    variables: [], // No variables needed - this is a Twilio flow template
    requiresTimeInput: false,
    category: "lifestyle"
  },

];

// API Configuration for different WhatsApp services
export const whatsappApiConfig = {
  "/send/text": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true // Use your backend server URL for free text messages
  },
  "/send/appointment-reminder": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true // Use your backend server URL
  },
  "/send/weekly-checkup": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true // Will use same endpoint for now, you can add more later
  },
  "/send/medication-followup": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true
  },
  "/send/lab-results": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true
  },
  "/send/prescription-refill": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true
  },
  "/send/patient-lifestyle": {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    requiresAuth: true,
    useServerUrl: true
  }
};

// Helper function to get value from nested object path
export const getNestedValue = (obj, path, fallback = null) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : fallback;
  }, obj);
};

// Helper function to format values based on type
export const formatValue = (value, format) => {
  if (!value) return value;

  switch (format) {
    case 'date':
      return formatDate(value);
    case 'time':
      return formatTime(value);
    default:
      return value;
  }
};

// Date formatting function
const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const day = date.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
      day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();
  const weekday = date.toLocaleString("en-US", { weekday: "long" });
  return `${weekday}, ${day}${suffix} ${month} ${year}`;
};

// Time formatting function
const formatTime = (timeString) => {
  if (!timeString) return timeString;

  // If it's already a time string (HH:MM), convert to 12-hour format
  if (typeof timeString === 'string' && timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // If it's a Date object, extract time
  const date = new Date(timeString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

// Function to process template variables
export const processTemplateVariables = (template, patient, user, additionalData = {}) => {
  let processedMessage = template.message;

  template.variables.forEach(variable => {
    let value = variable.fallback;

    // Get value based on source
    if (variable.source.startsWith('patient.')) {
      const patientPath = variable.source.replace('patient.', '');
      let extractedValue = getNestedValue(patient, patientPath, null);

      // If no value found, try alternative source
      if (!extractedValue && variable.alternativeSource) {
        const altPath = variable.alternativeSource.replace('patient.', '');
        extractedValue = getNestedValue(patient, altPath, null);
      }

      // Use extracted value if found, otherwise use fallback
      value = extractedValue || variable.fallback;
    } else if (variable.source.startsWith('user.')) {
      const userPath = variable.source.replace('user.', '');
      const extractedValue = getNestedValue(user, userPath, null);
      value = extractedValue || variable.fallback;
    } else if (additionalData[variable.source]) {
      value = additionalData[variable.source];
    }

    // Format value if needed
    if (variable.format && value !== variable.fallback) {
      value = formatValue(value, variable.format);
    }

    // Replace in message
    processedMessage = processedMessage.replace(new RegExp(escapeRegExp(variable.key), 'g'), value);
  });

  return processedMessage;
};

// Enhanced function to get backend payload data
export const getBackendPayloadData = (template, patient, user, additionalData = {}) => {
  const payload = {
    to: patient.phone || patient.phoneNumber || patient.contact,
    patientId: patient.id,
    organizationId: user.organizationId || user.tenantId || 1,
  };

  // For free text messages, add the message content
  if (template.id === 'text-message' && additionalData.message) {
    payload.message = additionalData.message;
  }

  // Check if template has variables before processing
  if (template.variables && Array.isArray(template.variables)) {
    template.variables.forEach(variable => {
      if (variable.backendKey) {
        let value = variable.fallback;

        // Get value based on source
        if (variable.source.startsWith('patient.')) {
          const patientPath = variable.source.replace('patient.', '');
          let extractedValue = getNestedValue(patient, patientPath, null);

          // If no value found, try alternative source
          if (!extractedValue && variable.alternativeSource) {
            const altPath = variable.alternativeSource.replace('patient.', '');
            extractedValue = getNestedValue(patient, altPath, null);
          }

          // Use extracted value if found, otherwise use fallback
          value = extractedValue || variable.fallback;
        } else if (variable.source.startsWith('user.')) {
          const userPath = variable.source.replace('user.', '');
          const extractedValue = getNestedValue(user, userPath, null);
          value = extractedValue || variable.fallback;
        } else if (additionalData[variable.source]) {
          value = additionalData[variable.source];
        }

        // Format value if needed
        if (variable.format && value !== variable.fallback) {
          value = formatValue(value, variable.format);
        }

        payload[variable.backendKey] = value;
      }
    });
  }

  return payload;
};

// Helper function to escape special regex characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Function to get API configuration for a template
export const getApiConfigForTemplate = (template) => {
  return whatsappApiConfig[template.apiEndpoint] || whatsappApiConfig["/whatsapp/appointment-reminder"];
};