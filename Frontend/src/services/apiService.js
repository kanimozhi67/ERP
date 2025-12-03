// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with better configuration
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data,
      responseData: error.response?.data,
    });
    return Promise.reject(error);
  }
);

const apiService = {
  // ========== WORKER EMPLOYEES ENDPOINT ==========
  getWorkerEmployees: async (companyId, search = '') => {
    try {
      console.log('🔍 Fetching worker employees for company:', companyId);
      
      const response = await axiosInstance.get('/employees/workers', {
        params: {
          companyId,
          search,
          role: 'worker'
        }
      });
      
      console.log('✅ Worker employees response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching worker employees:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
      
      // If the specific endpoint fails, try fallback to regular employees
      if (error.response?.status === 404) {
        console.log('🔄 Trying fallback: using regular employees endpoint');
        try {
          const fallbackResponse = await axiosInstance.get(`/employees/company/${companyId}`);
          if (fallbackResponse.data && fallbackResponse.data.success) {
            // Filter only active employees for fallback
            const activeEmployees = (fallbackResponse.data.data || []).filter(
              emp => emp.status === 'ACTIVE'
            );
            return {
              success: true,
              data: activeEmployees
            };
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
      
      throw error;
    }
  },

  // ========== EMAIL NOTIFICATION ENDPOINTS ==========
  sendFleetTaskNotification: async (notificationData) => {
    try {
      console.log('📧 Sending fleet task notification:', notificationData);
      const response = await axiosInstance.post('/notifications/fleet-task', notificationData);
      console.log('✅ Notification sent successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error sending notification:', error.response?.data || error.message);
      throw error;
    }
  },

  // ========== VEHICLE ENDPOINTS ==========
  getVehicles: async () => {
    try {
      console.log('🔍 Fetching all vehicles...');
      const response = await axiosInstance.get('/fleet-vehicles');
      console.log('🚗 Raw vehicles response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error.response?.data || error.message);
      throw error;
    }
  },

  getVehicleById: async (vehicleId) => {
    try {
      const response = await axiosInstance.get(`/fleet-vehicles/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  createVehicle: async (vehicleData) => {
    try {
      console.log('📤 Creating vehicle with data:', JSON.stringify(vehicleData, null, 2));
      const response = await axiosInstance.post('/fleet-vehicles', vehicleData);
      console.log('✅ Vehicle created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating vehicle:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create vehicle';
      throw new Error(errorMessage);
    }
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      console.log('📤 Updating vehicle:', vehicleId, JSON.stringify(vehicleData, null, 2));
      const response = await axiosInstance.put(`/fleet-vehicles/${vehicleId}`, vehicleData);
      console.log('✅ Vehicle updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating vehicle:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update vehicle';
      throw new Error(errorMessage);
    }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      console.log('📤 Deleting vehicle:', vehicleId);
      const response = await axiosInstance.delete(`/fleet-vehicles/${vehicleId}`);
      console.log('✅ Vehicle deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting vehicle:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete vehicle';
      throw new Error(errorMessage);
    }
  },

  getVehiclesByCompany: async (companyId) => {
    try {
      console.log('🔍 Fetching vehicles for company ID:', companyId);
      
      let response;
      
      // First try the numeric companyId (like 1, 2, 3)
      if (typeof companyId === 'number' || /^\d+$/.test(companyId)) {
        response = await axiosInstance.get(`/fleet-vehicles/company/${companyId}`);
      } 
      // If it's an ObjectId, try that endpoint
      else if (companyId.length === 24) {
        response = await axiosInstance.get(`/fleet-vehicles/company/object/${companyId}`);
      }
      // Fallback to query parameter
      else {
        response = await axiosInstance.get(`/fleet-vehicles?companyId=${companyId}`);
      }
      
      console.log('🚗 Vehicles API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicles by company:', error.response?.data || error.message);
      
      try {
        console.log('🔄 Trying fallback: get all vehicles');
        const allResponse = await axiosInstance.get('/fleet-vehicles');
        const allVehicles = Array.isArray(allResponse.data) ? allResponse.data : 
                           allResponse.data.data || allResponse.data.vehicles || [];
        
        const filteredVehicles = allVehicles.filter(vehicle => {
          const vehicleCompanyId = vehicle.companyId || vehicle.company;
          return vehicleCompanyId == companyId || 
                 vehicleCompanyId?.toString() === companyId?.toString();
        });
        
        console.log('✅ Filtered vehicles:', filteredVehicles);
        return { data: filteredVehicles };
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw error;
      }
    }
  },

  // ========== COMPANY ENDPOINTS ==========
  getCompanies: async () => {
    try {
      console.log('🔍 Fetching all companies...');
      const response = await axiosInstance.get('/companies');
      console.log('🏢 Raw companies response:', response.data);
      
      if (response.data) {
        console.log('📊 Companies response structure:', {
          hasData: !!response.data.data,
          dataIsArray: Array.isArray(response.data.data),
          dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
          firstItem: Array.isArray(response.data.data) ? response.data.data[0] : 'N/A'
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching companies:', error.response?.data || error.message);
      throw error;
    }
  },

  getCompanyById: async (companyId) => {
    try {
      const response = await axiosInstance.get(`/companies/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  createCompany: async (companyData) => {
    try {
      console.log('📤 Creating company with data:', JSON.stringify(companyData, null, 2));
      const response = await axiosInstance.post('/companies', companyData);
      console.log('✅ Company created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating company:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create company';
      throw new Error(errorMessage);
    }
  },

  updateCompany: async (companyId, companyData) => {
    try {
      console.log('📤 Updating company:', companyId, JSON.stringify(companyData, null, 2));
      const response = await axiosInstance.put(`/companies/${companyId}`, companyData);
      console.log('✅ Company updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating company:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update company';
      throw new Error(errorMessage);
    }
  },

  deleteCompany: async (companyId) => {
    try {
      console.log('📤 Deleting company:', companyId);
      const response = await axiosInstance.delete(`/companies/${companyId}`);
      console.log('✅ Company deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting company:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete company';
      throw new Error(errorMessage);
    }
  },

  // ========== DRIVER ENDPOINTS ==========
  getDrivers: async () => {
    try {
      const response = await axiosInstance.get('/drivers');
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error.response?.data || error.message);
      throw error;
    }
  },

  getDriverById: async (driverId) => {
    try {
      const response = await axiosInstance.get(`/drivers/${driverId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  getDriversByCompany: async (companyId) => {
    try {
      const response = await axiosInstance.get(`/drivers/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers by company:', error.response?.data || error.message);
      throw error;
    }
  },

  createDriver: async (driverData) => {
    try {
      console.log('📤 Creating driver with data:', JSON.stringify(driverData, null, 2));
      const response = await axiosInstance.post('/drivers', driverData);
      console.log('✅ Driver created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating driver:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create driver';
      throw new Error(errorMessage);
    }
  },

  updateDriver: async (driverId, driverData) => {
    try {
      console.log('📤 Updating driver:', driverId, JSON.stringify(driverData, null, 2));
      const response = await axiosInstance.put(`/drivers/${driverId}`, driverData);
      console.log('✅ Driver updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating driver:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update driver';
      throw new Error(errorMessage);
    }
  },

  deleteDriver: async (driverId) => {
    try {
      console.log('📤 Deleting driver:', driverId);
      const response = await axiosInstance.delete(`/drivers/${driverId}`);
      console.log('✅ Driver deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting driver:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete driver';
      throw new Error(errorMessage);
    }
  },

  updateDriverStatus: async (driverId, status) => {
    try {
      console.log('📤 Updating driver status:', { driverId, status });
      const response = await axiosInstance.patch(`/drivers/${driverId}/status`, { status });
      console.log('✅ Driver status updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating driver status:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update driver status';
      throw new Error(errorMessage);
    }
  },

  // ========== EMPLOYEE ENDPOINTS ==========
  getEmployees: async () => {
    try {
      console.log('🔍 Fetching all employees...');
      const response = await axiosInstance.get('/employees');
      console.log('👥 Raw employees response:', response.data);
      
      if (response.data) {
        console.log('📊 Employees response structure:', {
          hasData: !!response.data.data,
          dataIsArray: Array.isArray(response.data.data),
          dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'N/A',
          firstItem: Array.isArray(response.data.data) ? response.data.data[0] : 'N/A'
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching employees:', error.response?.data || error.message);
      throw error;
    }
  },

  getEmployeesByCompany: async (companyId) => {
    try {
      console.log('🔍 Calling getEmployeesByCompany with companyId:', companyId);
      const response = await axiosInstance.get(`/employees/company/${companyId}`);
      
      console.log('👥 Raw employees by company response:', response.data);
      
      if (response.data) {
        const employeesData = Array.isArray(response.data.data) ? response.data.data : 
                            Array.isArray(response.data) ? response.data : [];
        
        console.log('📊 Employees data analysis:', {
          totalItems: employeesData.length,
          firstItemKeys: employeesData[0] ? Object.keys(employeesData[0]) : 'No data',
          firstItemValues: employeesData[0] || 'No data',
          hasEmployeeCode: employeesData[0]?.employeeCode ? 'Yes' : 'No',
          hasJobTitle: employeesData[0]?.jobTitle ? 'Yes' : 'No'
        });

        employeesData.forEach((emp, index) => {
          console.log(`👤 Employee ${index + 1}:`, {
            id: emp.id,
            name: emp.fullName,
            employeeCode: emp.employeeCode,
            jobTitle: emp.jobTitle,
            status: emp.status
          });
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching employees by company:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        url: error.config?.url
      });
      
      if (error.response?.status === 404) {
        console.log('🔄 Trying fallback: fetching all employees and filtering...');
        try {
          const allEmployeesResponse = await axiosInstance.get('/employees');
          let allEmployees = [];
          
          if (allEmployeesResponse.data && Array.isArray(allEmployeesResponse.data.data)) {
            allEmployees = allEmployeesResponse.data.data;
          } else if (Array.isArray(allEmployeesResponse.data)) {
            allEmployees = allEmployeesResponse.data;
          }
          
          const filteredEmployees = allEmployees.filter(emp => 
            emp.companyId === parseInt(companyId) || emp.companyId == companyId
          );
          
          console.log(`🔄 Fallback successful: Found ${filteredEmployees.length} employees for company ${companyId}`);
          
          return {
            success: true,
            data: filteredEmployees
          };
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw new Error('Employees endpoint not found and fallback failed.');
        }
      }
      
      throw error;
    }
  },

  createEmployee: async (employeeData) => {
    try {
      console.log('📤 Creating employee with data:', JSON.stringify(employeeData, null, 2));
      const response = await axiosInstance.post('/employees', employeeData);
      console.log('✅ Employee created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating employee:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create employee';
      throw new Error(errorMessage);
    }
  },

  updateEmployee: async (employeeId, employeeData) => {
    try {
      console.log('📤 Updating employee:', employeeId, JSON.stringify(employeeData, null, 2));
      const response = await axiosInstance.put(`/employees/${employeeId}`, employeeData);
      console.log('✅ Employee updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating employee:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update employee';
      throw new Error(errorMessage);
    }
  },

  deleteEmployee: async (employeeId) => {
    try {
      console.log('📤 Deleting employee:', employeeId);
      const response = await axiosInstance.delete(`/employees/${employeeId}`);
      console.log('✅ Employee deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting employee:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete employee';
      throw new Error(errorMessage);
    }
  },

  updateEmployeeStatus: async (employeeId, status) => {
    try {
      console.log('📤 Updating employee status:', { employeeId, status });
      const response = await axiosInstance.patch(`/employees/${employeeId}/status`, { status });
      console.log('✅ Employee status updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating employee status:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update employee status';
      throw new Error(errorMessage);
    }
  },

  // ========== PROJECT ENDPOINTS ==========
  getProjects: async () => {
    try {
      const response = await axiosInstance.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error.response?.data || error.message);
      throw error;
    }
  },

  getProjectsByCompany: async (companyId) => {
    try {
      const response = await axiosInstance.get(`/projects/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects by company:', error.response?.data || error.message);
      throw error;
    }
  },

  // ========== FLEET TASK ENDPOINTS ==========
  getFleetTasks: async () => {
    try {
      const response = await axiosInstance.get('/fleet-tasks');
      return response.data;
    } catch (error) {
      console.error('Error fetching fleet tasks:', error.response?.data || error.message);
      throw error;
    }
  },

  getFleetTaskById: async (taskId) => {
    try {
      const response = await axiosInstance.get(`/fleet-tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fleet task by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  createFleetTask: async (taskData) => {
    try {
      console.log('📤 Creating fleet task with data:', JSON.stringify(taskData, null, 2));
      const response = await axiosInstance.post('/fleet-tasks', taskData);
      console.log('✅ Fleet task created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating fleet task:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create fleet task';
      throw new Error(errorMessage);
    }
  },

  updateFleetTask: async (taskId, taskData) => {
    try {
      console.log('📤 Updating fleet task:', taskId, JSON.stringify(taskData, null, 2));
      const response = await axiosInstance.put(`/fleet-tasks/${taskId}`, taskData);
      console.log('✅ Fleet task updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating fleet task:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update fleet task';
      throw new Error(errorMessage);
    }
  },

  deleteFleetTask: async (taskId) => {
    try {
      console.log('📤 Deleting fleet task:', taskId);
      const response = await axiosInstance.delete(`/fleet-tasks/${taskId}`);
      console.log('✅ Fleet task deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting fleet task:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete fleet task';
      throw new Error(errorMessage);
    }
  },

  updateFleetTaskStatus: async (taskId, status) => {
    try {
      console.log('📤 Updating fleet task status:', { taskId, status });
      const response = await axiosInstance.patch(`/fleet-tasks/${taskId}/status`, { status });
      console.log('✅ Fleet task status updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating fleet task status:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update fleet task status';
      throw new Error(errorMessage);
    }
  },

  // ========== FLEET TASK PASSENGER ENDPOINTS ==========
  getFleetTaskPassengers: async () => {
    try {
      const response = await axiosInstance.get('/fleet-task-passengers');
      return response.data;
    } catch (error) {
      console.error('Error fetching fleet task passengers:', error.response?.data || error.message);
      throw error;
    }
  },

  getFleetTaskPassengersByTaskId: async (taskId) => {
    try {
      console.log('📤 Fetching passengers for task ID:', taskId);
      const response = await axiosInstance.get(`/fleet-task-passengers/task/${taskId}`);
      console.log('✅ Passengers fetched successfully for task:', taskId);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching passengers by task ID:', error.response?.data || error.message);
      throw error;
    }
  },

  getFleetTaskPassengersByCompany: async (companyId) => {
    try {
      const response = await axiosInstance.get(`/fleet-task-passengers/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching passengers by company:', error.response?.data || error.message);
      throw error;
    }
  },

  getFleetTaskPassengerById: async (passengerId) => {
    try {
      const response = await axiosInstance.get(`/fleet-task-passengers/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching passenger by ID:', error.response?.data || error.message);
      throw error;
    }
  },

  createFleetTaskPassenger: async (passengerData) => {
    try {
      console.log('📤 Creating fleet task passenger with data:', JSON.stringify(passengerData, null, 2));
      const response = await axiosInstance.post('/fleet-task-passengers', passengerData);
      console.log('✅ Fleet task passenger created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating fleet task passenger:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to create fleet task passenger';
      throw new Error(errorMessage);
    }
  },

  updateFleetTaskPassenger: async (passengerId, passengerData) => {
    try {
      console.log('📤 Updating fleet task passenger:', passengerId, JSON.stringify(passengerData, null, 2));
      const response = await axiosInstance.put(`/fleet-task-passengers/${passengerId}`, passengerData);
      console.log('✅ Fleet task passenger updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating fleet task passenger:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to update fleet task passenger';
      throw new Error(errorMessage);
    }
  },

  deleteFleetTaskPassenger: async (passengerId) => {
    try {
      console.log('📤 Deleting fleet task passenger:', passengerId);
      const response = await axiosInstance.delete(`/fleet-task-passengers/${passengerId}`);
      console.log('✅ Fleet task passenger deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting fleet task passenger:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete fleet task passenger';
      throw new Error(errorMessage);
    }
  },

  deleteFleetTaskPassengersByTaskId: async (taskId) => {
    try {
      console.log('📤 Deleting all passengers for task ID:', taskId);
      const response = await axiosInstance.delete(`/fleet-task-passengers/task/${taskId}`);
      console.log('✅ All passengers deleted for task:', taskId);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting passengers by task ID:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete passengers by task ID';
      throw new Error(errorMessage);
    }
  },
};

export default apiService;