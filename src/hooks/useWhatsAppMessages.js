import { useState, useEffect, useCallback } from 'react';
import whatsappService from '../services/whatsappService';
import { toast } from 'react-hot-toast';

export const useWhatsAppMessages = (patientId = null, phoneNumber = null, autoRefresh = false) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  // Load messages based on patientId or phoneNumber
  const loadMessages = useCallback(async (limit = 50) => {
    if (!patientId && !phoneNumber) return;

    try {
      setLoading(true);
      setError(null);

      let fetchedMessages;
      if (patientId) {
        fetchedMessages = await whatsappService.getPatientMessages(patientId, limit);
      } else if (phoneNumber) {
        fetchedMessages = await whatsappService.getMessageHistory(phoneNumber, limit);
      }

      setMessages(fetchedMessages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [patientId, phoneNumber]);

  // Load all messages with pagination
  const loadAllMessages = useCallback(async (page = 1, limit = 50, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const result = await whatsappService.getAllMessages(page, limit, filters);
      setMessages(result.messages || []);
      setPagination(result.pagination || {});
    } catch (err) {
      console.error('Error loading all messages:', err);
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a new message
  const sendMessage = useCallback(async (template, message, patient, user, additionalData = {}) => {
    try {
      const result = await whatsappService.sendMessage(template, message, patient, user, additionalData);
      
      if (result.success) {
        toast.success('Message sent successfully');
        // Reload messages to show the sent message
        await loadMessages();
        return result;
      } else {
        toast.error(result.error || 'Failed to send message');
        return result;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return { success: false, error: err.message };
    }
  }, [loadMessages]);

  // Refresh messages
  const refreshMessages = useCallback(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-refresh messages at intervals
  useEffect(() => {
    if (autoRefresh && (patientId || phoneNumber)) {
      const interval = setInterval(() => {
        loadMessages();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, patientId, phoneNumber, loadMessages]);

  // Initial load
  useEffect(() => {
    if (patientId || phoneNumber) {
      loadMessages();
    }
  }, [patientId, phoneNumber, loadMessages]);

  return {
    messages,
    loading,
    error,
    pagination,
    loadMessages,
    loadAllMessages,
    sendMessage,
    refreshMessages
  };
};

export default useWhatsAppMessages;