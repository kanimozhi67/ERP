// src/services/vehicleService.js
import apiService from './apiService';

const vehicleService = {
  // Get all vehicles
  getVehicles: async () => {
    try {
      const response = await apiService.getVehicles();
      return response;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  },

  // Get vehicle by ID
  getVehicleById: async (vehicleId) => {
    try {
      const response = await apiService.getVehicleById(vehicleId);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  // Create new vehicle
  createVehicle: async (vehicleData) => {
    try {
      const response = await apiService.createVehicle(vehicleData);
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  // Update vehicle
  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      const response = await apiService.updateVehicle(vehicleId, vehicleData);
      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  // Delete vehicle
  deleteVehicle: async (vehicleId) => {
    try {
      const response = await apiService.deleteVehicle(vehicleId);
      return response;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  // Get vehicles by company
  getVehiclesByCompany: async (companyId) => {
    try {
      const response = await apiService.getVehiclesByCompany(companyId);
      return response;
    } catch (error) {
      console.error('Error fetching vehicles by company:', error);
      throw error;
    }
  },

  // Get all vehicles with fallback
  getAllVehicles: async () => {
    try {
      const response = await apiService.getVehicles();
      return response;
    } catch (error) {
      console.error('Error fetching all vehicles:', error);
      throw error;
    }
  }
};

export default vehicleService;