import { apiPost, apiPut, apiDelete } from '../config/api.js';

/**
 * Alert service for medical record alert operations
 * Provides methods to interact with the generic medical record endpoints for alerts
 */
export const alertService = {
  /**
   * Create a new alert for a patient
   * @param {string} patientId - The patient ID
   * @param {Object} alertData - The alert data (alert, flagged, etc.)
   * @returns {Promise<Object>} - Created alert record
   */
  createAlert: async (patientId, alertData) => {
    if (!patientId) {
      throw new Error('Patient ID is required to create alert');
    }
    
    if (!alertData || !alertData.alert) {
      throw new Error('Alert data with alert message is required');
    }

    try {
      const data = await apiPost('/patients/medical/alert', {
        patientId,
        ...alertData
      });
      return data;
    } catch (error) {
      console.error(`Error creating alert for patient ${patientId}:`, error);
      throw error;
    }
  },

  /**
   * Update an existing alert
   * @param {string} alertId - The alert record ID
   * @param {Object} updateData - The data to update (read status, flagged, etc.)
   * @returns {Promise<Object>} - Updated alert record
   */
  updateAlert: async (alertId, updateData) => {
    if (!alertId) {
      throw new Error('Alert ID is required to update alert');
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new Error('Update data is required and must not be empty');
    }

    try {
      const data = await apiPut(`/patients/medical/alert/${alertId}`, updateData);
      return data;
    } catch (error) {
      console.error(`Error updating alert ${alertId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an alert
   * @param {string} alertId - The alert record ID
   * @returns {Promise<Object>} - API response
   */
  deleteAlert: async (alertId) => {
    if (!alertId) {
      throw new Error('Alert ID is required to delete alert');
    }

    try {
      const data = await apiDelete(`/patients/medical/alert/${alertId}`);
      return data;
    } catch (error) {
      console.error(`Error deleting alert ${alertId}:`, error);
      throw error;
    }
  },

  /**
   * Mark an alert as read
   * @param {string} alertId - The alert record ID
   * @returns {Promise<Object>} - Updated alert record
   */
  markAlertAsRead: async (alertId) => {
    return await alertService.updateAlert(alertId, { read: true });
  },

  /**
   * Update alert flagged status
   * @param {string} alertId - The alert record ID
   * @param {boolean} flagged - Whether the alert should be flagged
   * @returns {Promise<Object>} - Updated alert record
   */
  updateAlertFlaggedStatus: async (alertId, flagged) => {
    return await alertService.updateAlert(alertId, { flagged });
  }
};