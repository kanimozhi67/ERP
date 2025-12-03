// services/JsDriverService.js
import apiService from './JsApiService';

const driverService = {
  // Get all drivers
  getDrivers: async () => {
    try {
      const response = await apiService.get('/drivers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    try {
      const response = await apiService.get(`/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create driver
  createDriver: async (driverData) => {
    try {
      const response = await apiService.post('/drivers', driverData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default driverService;