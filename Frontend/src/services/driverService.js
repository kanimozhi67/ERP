import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Temporary employee data since the employees API is broken
const temporaryEmployees = [
  {
    id: 1,
    companyId: 1,
    employeeCode: "EMP001",
    fullName: "John Doe",
    jobTitle: "Software Engineer",
    status: "ACTIVE"
  },
  {
    id: 2,
    companyId: 1,
    employeeCode: "EMP002",
    fullName: "Jane Smith", 
    jobTitle: "Senior Driver",
    status: "ACTIVE"
  }
];

export const driverService = {
  // Get drivers by company ID - with employee data included
  getDriversByCompany: async (companyId) => {
    try {
      console.log('Fetching drivers for company ID:', companyId);
      
      // Use the endpoint that we know works
      const response = await axios.get(`${API_BASE_URL}/drivers/company/${companyId}`);
      
      console.log('Drivers API Response:', response.data);
      
      // Enhance driver data with employee names
      let driversData = response.data;
      if (driversData && Array.isArray(driversData.data)) {
        driversData.data = driversData.data.map(driver => ({
          ...driver,
          // Add employee name directly to driver object
          employeeName: getEmployeeNameById(driver.employeeId),
          employeeDetails: getEmployeeById(driver.employeeId)
        }));
      } else if (Array.isArray(driversData)) {
        driversData = driversData.map(driver => ({
          ...driver,
          // Add employee name directly to driver object
          employeeName: getEmployeeNameById(driver.employeeId),
          employeeDetails: getEmployeeById(driver.employeeId)
        }));
      }
      
      return driversData;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  },

  // Get all drivers
  getAllDrivers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all drivers:', error);
      throw error;
    }
  },

  // Get driver by ID
  getDriverById: async (driverId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver by ID:', error);
      throw error;
    }
  },

  // Create new driver
  createDriver: async (driverData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/drivers`, driverData);
      return response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  },

  // Update driver
  updateDriver: async (driverId, driverData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/drivers/${driverId}`, driverData);
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }
};

// Helper functions to get employee data
function getEmployeeById(employeeId) {
  return temporaryEmployees.find(emp => emp.id == employeeId);
}

function getEmployeeNameById(employeeId) {
  const employee = temporaryEmployees.find(emp => emp.id == employeeId);
  return employee ? employee.fullName : `Driver ${employeeId}`;
}

export default driverService;