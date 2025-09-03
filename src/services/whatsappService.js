// WhatsApp Service for handling API calls
import { getApiConfigForTemplate, getBackendPayloadData } from '../config/whatsappTemplates.js';

class WhatsAppService {
  constructor() {
    this.apiKey = import.meta.env.VITE_WHATSAPP_API_KEY;
    this.serverUrl = `${import.meta.env.VITE_SERVER_URL}/whatsapp`;
  }

  // Send WhatsApp message using the configured API
  async sendMessage(template, processedMessage, patient, user, additionalData = {}) {
    try {
      const apiConfig = getApiConfigForTemplate(template);

      // Build the request payload for your backend
      const payload = this.buildBackendPayload(template, processedMessage, patient, user, additionalData);

      // Prepare headers
      const headers = { ...apiConfig.headers };

      // Use your server URL
      const url = `${this.serverUrl}${template.apiEndpoint}`;

      // Make the API call to your backend
      const response = await fetch(url, {
        method: apiConfig.method,
        headers,
        body: JSON.stringify(payload),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        success: true,
        messageId: result.data?.messageId || result.messageId || `msg_${Date.now()}`,
        data: result
      };

    } catch (error) {
      console.error('WhatsApp send error:', error);

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Build payload for your backend API
  buildBackendPayload(template, processedMessage, patient, user, additionalData = {}) {
    // For free text messages, include the message content
    if (template.id === 'text-message') {
      additionalData.message = processedMessage;
    } else {
      // Try to extract selected time from the processed message if not provided in additionalData
      if (!additionalData.selectedTime) {
        const timeMatch = processedMessage.match(/(\d{1,2}:\d{2}\s*(AM|PM|am|pm))/);
        if (timeMatch) {
          additionalData.selectedTime = timeMatch[1];
        }
      }
    }

    // Get the properly formatted payload using the config function
    const payload = getBackendPayloadData(template, patient, user, additionalData);

    return payload;
  }

  // Helper method to format date
  formatDate(isoDate) {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    const day = date.getDate();
    const suffix = day % 10 === 1 && day !== 11 ? "st" :
      day % 10 === 2 && day !== 12 ? "nd" :
        day % 10 === 3 && day !== 13 ? "rd" : "th";
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    const weekday = date.toLocaleString("en-US", { weekday: "long" });
    return `${weekday}, ${day}${suffix} ${month} ${year}`;
  }

  // Helper to escape regex characters
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Log message to your database
  async logMessageToDatabase(template, message, patient, user, apiResponse) {
    try {
      const response = await fetch(`${this.serverUrl}/whatsapp-messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          patient_id: patient.id,
          template_id: template.id,
          template_title: template.title,
          message_content: message,
          whatsapp_message_id: apiResponse.id || apiResponse.message_id,
          status: apiResponse.status || 'sent',
          api_response: apiResponse,
          sent_at: new Date().toISOString()
        }),
        credentials: "include",
      });

      if (!response.ok) {
        console.warn('Failed to log WhatsApp message to database:', response.status);
      }

      return await response.json();
    } catch (error) {
      console.error('Error logging WhatsApp message:', error);
    }
  }

  // Get message delivery status
  async getMessageStatus(messageId) {
    try {
      const response = await fetch(`${this.serverUrl}/whatsapp-messages/${messageId}/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking message status:', error);
      return { status: 'unknown', error: error.message };
    }
  }

  // Get patient messages
  async getPatientMessages(patientId, limit = 50) {
    try {
      const response = await fetch(`${this.serverUrl}/messages/patient/${patientId}?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch patient messages: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching patient messages:', error);
      throw error;
    }
  }

  // Get message history by phone number
  async getMessageHistory(phoneNumber, limit = 50) {
    try {
      const response = await fetch(`${this.serverUrl}/messages/phone/${encodeURIComponent(phoneNumber)}?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch message history: ${response.status}`);
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching message history:', error);
      throw error;
    }
  }

  // Get all messages with pagination
  async getAllMessages(page = 1, limit = 50, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await fetch(`${this.serverUrl}/messages?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();
      return {
        messages: result.data || [],
        pagination: result.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching all messages:', error);
      throw error;
    }
  }

  // Validate patient has WhatsApp number
  validatePatientContact(patient) {
    const phone = patient.phone || patient.phoneNumber;

    if (!phone) {
      return {
        valid: false,
        error: 'Patient does not have a phone number on file'
      };
    }

    // Strict validation - must start with + for international format
    if (!phone.startsWith('+')) {
      return {
        valid: false,
        error: 'Patient phone number must be in international format starting with + (e.g., +254712345678)'
      };
    }

    // Validate international phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      return {
        valid: false,
        error: 'Patient phone number format is invalid. Use international format: +[country code][number]'
      };
    }

    return { valid: true };
  }
}

export default new WhatsAppService();