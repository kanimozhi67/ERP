// src/services/fleetTaskService.js
import apiService from './apiService';

const fleetTaskService = {
  // CREATE - Create new fleet task
  createFleetTask: async (taskData) => {
    try {
      console.log('📤 FRONTEND: Sending POST to /api/fleet-tasks');
      console.log('📦 FRONTEND: Request data:', JSON.stringify(taskData, null, 2));
      
      const response = await apiService.createFleetTask(taskData);
      
      console.log('✅ FRONTEND: Backend response received');
      console.log('📨 FRONTEND: Response data:', JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error('❌ FRONTEND: Error in fleetTaskService:', error);
      console.error('❌ FRONTEND: Error details:', error.response?.data);
      throw error;
    }
  },

  // READ - Get all fleet tasks
  getFleetTasks: async () => {
    try {
      const response = await apiService.getFleetTasks();
      return response;
    } catch (error) {
      console.error('Error fetching fleet tasks:', error);
      throw error;
    }
  },

  // READ - Get single fleet task by ID
  getFleetTaskById: async (id) => {
    try {
      console.log(`📤 FRONTEND: Fetching fleet task with ID: ${id}`);
      const response = await apiService.getFleetTaskById(id);
      return response;
    } catch (error) {
      console.error(`❌ FRONTEND: Error fetching fleet task ${id}:`, error);
      throw error;
    }
  },

  // UPDATE - Update existing fleet task
  updateFleetTask: async (id, taskData) => {
    try {
      console.log(`📤 FRONTEND: Sending PUT to /api/fleet-tasks/${id}`);
      console.log('📦 FRONTEND: Update data:', JSON.stringify(taskData, null, 2));
      
      const response = await apiService.updateFleetTask(id, taskData);
      
      console.log('✅ FRONTEND: Update response received');
      console.log('📨 FRONTEND: Response data:', JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error(`❌ FRONTEND: Error updating fleet task ${id}:`, error);
      console.error('❌ FRONTEND: Error details:', error.response?.data);
      throw error;
    }
  },

  // DELETE - Remove fleet task
  deleteFleetTask: async (id) => {
    try {
      console.log(`📤 FRONTEND: Sending DELETE to /api/fleet-tasks/${id}`);
      
      const response = await apiService.deleteFleetTask(id);
      
      console.log('✅ FRONTEND: Delete response received');
      console.log('📨 FRONTEND: Response data:', JSON.stringify(response, null, 2));
      
      return response;
    } catch (error) {
      console.error(`❌ FRONTEND: Error deleting fleet task ${id}:`, error);
      console.error('❌ FRONTEND: Error details:', error.response?.data);
      throw error;
    }
  },

  // PATCH - Update fleet task status
  updateFleetTaskStatus: async (id, status) => {
    try {
      console.log(`📤 FRONTEND: Updating status for fleet task ${id} to: ${status}`);
      
      const response = await apiService.updateFleetTaskStatus(id, status);
      
      return response;
    } catch (error) {
      console.error(`❌ FRONTEND: Error updating status for fleet task ${id}:`, error);
      throw error;
    }
  },

  // NEW METHOD ADDED: Get fleet task passengers by task ID
  getFleetTaskPassengersByTaskId: async (taskId) => {
    try {
      console.log(`📤 FRONTEND: Fetching passengers for task ID: ${taskId}`);
      const response = await apiService.get(`/fleet-task-passengers/task/${taskId}`);
      console.log(`✅ FRONTEND: Received ${response?.data?.data?.length || 0} passengers for task ${taskId}`);
      return response;
    } catch (error) {
      console.error(`❌ FRONTEND: Error fetching passengers for task ${taskId}:`, error);
      throw error;
    }
  }
};

export default fleetTaskService;