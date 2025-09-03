// Template Manager Utility
// Helper functions to manage WhatsApp templates

import { whatsappTemplatesConfig } from '../config/whatsappTemplates.js';

export class TemplateManager {

  // Get all templates
  static getAllTemplates() {
    return whatsappTemplatesConfig;
  }

  // Get templates by category
  static getTemplatesByCategory(category) {
    return whatsappTemplatesConfig.filter(template => template.category === category);
  }

  // Get template by ID
  static getTemplateById(id) {
    return whatsappTemplatesConfig.find(template => template.id === id);
  }

  // Get all available categories
  static getCategories() {
    const categories = [...new Set(whatsappTemplatesConfig.map(template => template.category))];
    return categories.sort();
  }

  // Validate template structure
  static validateTemplate(template) {
    const requiredFields = ['id', 'title', 'message', 'apiEndpoint', 'variables', 'category'];
    const errors = [];

    requiredFields.forEach(field => {
      if (!template[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate variables structure
    if (template.variables && Array.isArray(template.variables)) {
      template.variables.forEach((variable, index) => {
        if (!variable.key || !variable.source || !variable.fallback) {
          errors.push(`Variable at index ${index} is missing required fields (key, source, fallback)`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Helper to create a new template structure
  static createTemplateStructure(options = {}) {
    return {
      id: options.id || Date.now(),
      title: options.title || "New Template",
      message: options.message || "Hello {{1}}, this is a new template message.",
      apiEndpoint: options.apiEndpoint || "/whatsapp/general",
      variables: options.variables || [
        { key: "{{1}}", source: "patient.name", fallback: "[Patient Name]" }
      ],
      requiresTimeInput: options.requiresTimeInput || false,
      category: options.category || "general"
    };
  }

  // Preview template with sample data
  static previewTemplate(template, sampleData = {}) {
    const defaultSampleData = {
      patient: {
        name: "John Doe",
        nextVisit: "2024-12-15T14:30:00",
        lastVisit: "2024-11-15T10:00:00",
        currentMedication: "Aspirin"
      },
      user: {
        name: "Dr. Smith"
      },
      selectedTime: "2:30 PM"
    };

    const mergedData = { ...defaultSampleData, ...sampleData };

    // Import the processTemplateVariables function
    // Note: In a real implementation, you'd import this properly
    let previewMessage = template.message;

    template.variables.forEach(variable => {
      let value = variable.fallback;

      if (variable.source.startsWith('patient.')) {
        const patientPath = variable.source.replace('patient.', '');
        value = this.getNestedValue(mergedData.patient, patientPath, variable.fallback);
      } else if (variable.source.startsWith('user.')) {
        const userPath = variable.source.replace('user.', '');
        value = this.getNestedValue(mergedData.user, userPath, variable.fallback);
      } else if (mergedData[variable.source]) {
        value = mergedData[variable.source];
      }

      previewMessage = previewMessage.replace(new RegExp(this.escapeRegExp(variable.key), 'g'), value);
    });

    return previewMessage;
  }

  // Helper function to get nested values
  static getNestedValue(obj, path, fallback = null) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : fallback;
    }, obj);
  }

  // Helper to escape regex characters
  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get template statistics
  static getTemplateStats() {
    const templates = this.getAllTemplates();
    const categories = this.getCategories();

    const stats = {
      totalTemplates: templates.length,
      categoriesCount: categories.length,
      categories: {},
      requiresTimeInput: templates.filter(t => t.requiresTimeInput).length,
      apiEndpoints: [...new Set(templates.map(t => t.apiEndpoint))].length
    };

    categories.forEach(category => {
      stats.categories[category] = templates.filter(t => t.category === category).length;
    });

    return stats;
  }
}

// Example usage and helper functions for adding new templates
export const templateExamples = {

  // Example: Blood Test Reminder
  bloodTestReminder: {
    id: 6,
    title: "Blood Test Reminder",
    message: "Hello {{1}}, This is a reminder that your blood test is scheduled for {{2}}. Please fast for 12 hours before the test. Contact us if you have any questions.",
    apiEndpoint: "/whatsapp/blood-test-reminder",
    variables: [
      { key: "{{1}}", source: "patient.name", fallback: "[Patient Name]" },
      { key: "{{2}}", source: "patient.nextLabDate", fallback: "[Test Date]", format: "date" }
    ],
    requiresTimeInput: false,
    category: "tests"
  },

  // Example: Insurance Verification
  insuranceVerification: {
    id: 7,
    title: "Insurance Verification",
    message: "Hello {{1}}, We need to verify your insurance information before your upcoming appointment on {{2}}. Please call us at your earliest convenience.",
    apiEndpoint: "/whatsapp/insurance-verification",
    variables: [
      { key: "{{1}}", source: "patient.name", fallback: "[Patient Name]" },
      { key: "{{2}}", source: "patient.nextVisit", fallback: "[Appointment Date]", format: "date" }
    ],
    requiresTimeInput: false,
    category: "administrative"
  },

  // Example: Emergency Contact
  emergencyContact: {
    id: 8,
    title: "Emergency Contact Information",
    message: "Hello {{1}}, For your safety, please update your emergency contact information. You can do this through our patient portal or by calling our office.",
    apiEndpoint: "/whatsapp/emergency-contact",
    variables: [
      { key: "{{1}}", source: "patient.name", fallback: "[Patient Name]" }
    ],
    requiresTimeInput: false,
    category: "administrative"
  }
};

export default TemplateManager;