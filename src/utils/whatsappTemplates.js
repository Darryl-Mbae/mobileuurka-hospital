// WhatsApp Message Templates
// Easy to modify and upgrade - just add new templates or modify existing ones

export const WHATSAPP_TEMPLATES = {
  // Appointment Reminder Template
  APPOINTMENT_REMINDER: {
    id: 'appointment_reminder',
    title: 'Appointment Reminder',
    icon: '📅',
    description: 'Remind patient about upcoming appointment',
    template: (patientName, doctorName, appointmentDate, appointmentTime) => `Hello ${patientName}, This is a reminder of your appointment with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}. Please confirm or reschedule below.`,
    variables: ['patientName', 'doctorName', 'appointmentDate', 'appointmentTime']
  },

  // Weekly Check-up Template
  WEEKLY_CHECKUP: {
    id: 'weekly_checkup',
    title: 'Weekly Checkup',
    icon: '💊',
    description: 'Weekly health status check-in',
    template: (patientName, clinicName) => `Hello ${patientName}, it's your weekly check-in from ${clinicName}. How have you felt over the past week compared to the previous one?`,
    variables: ['patientName', 'clinicName']
  },

  // Post-Checkup Medication Reminder Template
  POST_CHECKUP_MEDICATION: {
    id: 'post_checkup_medication',
    title: 'Post-Checkup Medication Reminder',
    icon: '✅',
    description: 'Follow-up after recent appointment with medication check',
    template: (patientName, visitDate) => `Hello ${patientName}, We hope you're recovering well after your visit on ${visitDate}. This is a quick check-in to see how you're feeling after starting your new medication. Have you noticed any changes in your symptoms?`,
    variables: ['patientName', 'visitDate']
  },

  // General Health Check Template
  HEALTH_CHECK: {
    id: 'health_check',
    title: 'Health Check',
    icon: '🩺',
    description: 'General health status inquiry',
    template: (patientName) => `How have you been feeling this week? Have you been having any complaints or aches?`,
    variables: ['patientName']
  }
};

// Helper function to get template by ID
export const getTemplate = (templateId) => {
  return WHATSAPP_TEMPLATES[templateId] || null;
};

// Helper function to get all template options for UI
export const getTemplateOptions = () => {
  return Object.values(WHATSAPP_TEMPLATES).map(template => ({
    id: template.id,
    title: template.title,
    icon: template.icon,
    description: template.description
  }));
};

// Helper function to generate message from template
export const generateMessage = (templateId, variables = {}) => {
  const template = getTemplate(templateId);
  if (!template) return null;

  // Extract variable values in the order they appear in the template
  const values = template.variables.map(varName => variables[varName] || `[${varName}]`);
  
  return template.template(...values);
};

// Helper function to check if user hasn't replied in 24+ hours
export const shouldShowPrompts = (lastReplyTime) => {
  if (!lastReplyTime) return true; // No previous reply, show prompts
  
  const now = new Date();
  const lastReply = new Date(lastReplyTime);
  const hoursDiff = (now - lastReply) / (1000 * 60 * 60);
  
  return hoursDiff >= 24;
};

// Default patient data helper (you can customize this based on your patient object structure)
export const getPatientVariables = (patient, user) => {
  return {
    patientName: patient?.name || patient?.firstName || '[Patient Name]',
    doctorName: user?.name || '[Doctor Name]',
    clinicName: 'Our Clinic', // You can make this configurable
    appointmentDate: '[Appointment Date]',
    appointmentTime: '[Appointment Time]',
    visitDate: new Date().toLocaleDateString()
  };
};

export default WHATSAPP_TEMPLATES;