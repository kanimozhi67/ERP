import apiService from './JsApiService';

const fleetTaskPassengerService = {
  // Create new fleet task passenger
  createFleetTaskPassenger: async (passengerData) => {
    try {
      console.log('🟡 Sending passenger data to backend:', passengerData);
      
      // Transform data to camelCase for backend
      const transformedData = {
        id: passengerData.id,
        companyId: passengerData.companyId,
        companyName: passengerData.companyName,
        fleetTaskId: passengerData.fleetTaskId,
        workerEmployeeId: passengerData.workerEmployeeId,
        employeeName: passengerData.employeeName,
        employeeCode: passengerData.employeeCode,
        department: passengerData.department,
        pickupLocation: passengerData.pickupLocation,
        dropLocation: passengerData.dropLocation,
        status: passengerData.status || 'PLANNED',
        createdBy: passengerData.createdBy
      };
      
      const response = await apiService.post('/fleet-task-passengers', transformedData);
      
      console.log('✅ Backend response for passenger:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create passenger');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error in fleetTaskPassengerService.createFleetTaskPassenger:', error);
      console.error('Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create passenger');
    }
  },

  // Get all fleet task passengers
  getAllFleetTaskPassengers: async () => {
    try {
      const response = await apiService.get('/fleet-task-passengers');
      
      if (response.data && response.data.success) {
        // Transform response data to camelCase
        const transformedData = response.data.data.map(passenger => ({
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        }));
        
        return {
          ...response.data,
          data: transformedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching all fleet task passengers:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch passengers');
    }
  },

  // Get fleet task passenger by ID
  getFleetTaskPassengerById: async (passengerId) => {
    try {
      const response = await apiService.get(`/fleet-task-passengers/${passengerId}`);
      
      if (response.data && response.data.success && response.data.data) {
        // Transform response data to camelCase
        const passenger = response.data.data;
        const transformedPassenger = {
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        };
        
        return {
          ...response.data,
          data: transformedPassenger
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching fleet task passenger by ID:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch passenger');
    }
  },

  // Get passengers by task ID
  getPassengersByTaskId: async (taskId) => {
    try {
      const response = await apiService.get(`/fleet-task-passengers/task/${taskId}`);
      
      if (response.data && response.data.success) {
        // Transform response data to camelCase
        const transformedData = response.data.data.map(passenger => ({
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        }));
        
        return {
          ...response.data,
          data: transformedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching passengers by task ID:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch passengers for task');
    }
  },

  // Get passengers by company ID
  getPassengersByCompany: async (companyId) => {
    try {
      const response = await apiService.get(`/fleet-task-passengers/company/${companyId}`);
      
      if (response.data && response.data.success) {
        // Transform response data to camelCase
        const transformedData = response.data.data.map(passenger => ({
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        }));
        
        return {
          ...response.data,
          data: transformedData
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching passengers by company:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch passengers for company');
    }
  },

  // Update fleet task passenger
  updateFleetTaskPassenger: async (passengerId, updateData) => {
    try {
      // Transform data to camelCase for backend
      const transformedData = {
        ...updateData
      };
      
      const response = await apiService.put(`/fleet-task-passengers/${passengerId}`, transformedData);
      
      if (response.data && response.data.success && response.data.data) {
        // Transform response data to camelCase
        const passenger = response.data.data;
        const transformedPassenger = {
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        };
        
        return {
          ...response.data,
          data: transformedPassenger
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating fleet task passenger:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update passenger');
    }
  },

  // Delete fleet task passenger
  deleteFleetTaskPassenger: async (passengerId) => {
    try {
      const response = await apiService.delete(`/fleet-task-passengers/${passengerId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting fleet task passenger:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete passenger');
    }
  },

  // Delete all passengers by task ID
  deletePassengersByTaskId: async (taskId) => {
    try {
      const response = await apiService.delete(`/fleet-task-passengers/task/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting passengers by task ID:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete passengers for task');
    }
  },

  // Batch create multiple passengers
  createBatchPassengers: async (passengersData) => {
    try {
      // Transform data to camelCase for backend
      const transformedPassengers = passengersData.map(passenger => ({
        id: passenger.id,
        companyId: passenger.companyId,
        companyName: passenger.companyName,
        fleetTaskId: passenger.fleetTaskId,
        workerEmployeeId: passenger.workerEmployeeId,
        employeeName: passenger.employeeName,
        employeeCode: passenger.employeeCode,
        department: passenger.department,
        pickupLocation: passenger.pickupLocation,
        dropLocation: passenger.dropLocation,
        status: passenger.status || 'PLANNED',
        createdBy: passenger.createdBy
      }));
      
      const promises = transformedPassengers.map(passenger => 
        apiService.post('/fleet-task-passengers', passenger)
      );
      
      const results = await Promise.all(promises);
      
      // Transform results to camelCase
      const transformedResults = results.map(result => {
        if (result.data && result.data.success && result.data.data) {
          const passenger = result.data.data;
          return {
            ...result.data,
            data: {
              id: passenger.id,
              companyId: passenger.companyId,
              companyName: passenger.companyName,
              fleetTaskId: passenger.fleetTaskId,
              workerEmployeeId: passenger.workerEmployeeId,
              employeeName: passenger.employeeName,
              employeeCode: passenger.employeeCode,
              department: passenger.department,
              pickupLocation: passenger.pickupLocation,
              dropLocation: passenger.dropLocation,
              status: passenger.status,
              createdBy: passenger.createdBy,
              createdAt: passenger.createdAt,
              updatedAt: passenger.updatedAt
            }
          };
        }
        return result.data;
      });
      
      return transformedResults;
    } catch (error) {
      console.error('❌ Error creating batch passengers:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create batch passengers');
    }
  },

  // Get all unique employee IDs from passengers
  getAllUniqueEmployeeIds: async () => {
    try {
      const response = await apiService.get('/fleet-task-passengers');
      const passengers = response.data.data || [];
      
      // Extract unique employee IDs
      const uniqueEmployeeIds = [...new Set(passengers.map(passenger => passenger.workerEmployeeId))];
      
      console.log('✅ Found unique employee IDs:', uniqueEmployeeIds);
      return uniqueEmployeeIds;
    } catch (error) {
      console.error('❌ Error fetching unique employee IDs:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch unique employee IDs');
    }
  },

  // Get passengers grouped by employee ID
  getPassengersGroupedByEmployee: async () => {
    try {
      const response = await apiService.get('/fleet-task-passengers');
      const passengers = response.data.data || [];
      
      // Group passengers by employee ID
      const groupedByEmployee = passengers.reduce((acc, passenger) => {
        const empId = passenger.workerEmployeeId;
        if (!acc[empId]) {
          acc[empId] = [];
        }
        
        // Transform passenger data to camelCase
        const transformedPassenger = {
          id: passenger.id,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          fleetTaskId: passenger.fleetTaskId,
          workerEmployeeId: passenger.workerEmployeeId,
          employeeName: passenger.employeeName,
          employeeCode: passenger.employeeCode,
          department: passenger.department,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          createdBy: passenger.createdBy,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        };
        
        acc[empId].push(transformedPassenger);
        return acc;
      }, {});
      
      console.log('✅ Grouped passengers by employee ID:', Object.keys(groupedByEmployee).length, 'employees');
      return groupedByEmployee;
    } catch (error) {
      console.error('❌ Error grouping passengers by employee:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to group passengers by employee');
    }
  },

  // Get employee statistics
  getEmployeeStatistics: async () => {
    try {
      const response = await apiService.get('/fleet-task-passengers');
      const passengers = response.data.data || [];
      
      const stats = {
        totalEmployees: new Set(passengers.map(p => p.workerEmployeeId)).size,
        totalPassengerRecords: passengers.length,
        employeesWithMultipleTrips: 0,
        employeeTripCounts: {},
        statusDistribution: {
          PLANNED: 0,
          ONGOING: 0,
          COMPLETED: 0,
          CANCELLED: 0
        }
      };
      
      // Count trips per employee and status distribution
      passengers.forEach(passenger => {
        const empId = passenger.workerEmployeeId;
        stats.employeeTripCounts[empId] = (stats.employeeTripCounts[empId] || 0) + 1;
        
        // Count status distribution
        const status = passenger.status || 'PLANNED';
        if (stats.statusDistribution[status] !== undefined) {
          stats.statusDistribution[status]++;
        }
      });
      
      // Count employees with multiple trips
      stats.employeesWithMultipleTrips = Object.values(stats.employeeTripCounts)
        .filter(count => count > 1).length;
      
      console.log('✅ Employee statistics:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching employee statistics:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch employee statistics');
    }
  },

  // Get all employee details with their passenger history
  getAllEmployeesWithDetails: async () => {
    try {
      const response = await apiService.get('/fleet-task-passengers');
      const passengers = response.data.data || [];
      
      // Create employee details object
      const employees = passengers.reduce((acc, passenger) => {
        const empId = passenger.workerEmployeeId;
        
        if (!acc[empId]) {
          acc[empId] = {
            employeeId: empId,
            employeeName: passenger.employeeName,
            employeeCode: passenger.employeeCode,
            department: passenger.department,
            totalTrips: 0,
            trips: []
          };
        }
        
        acc[empId].totalTrips++;
        
        // Transform trip data to camelCase
        const transformedTrip = {
          passengerId: passenger.id,
          fleetTaskId: passenger.fleetTaskId,
          companyId: passenger.companyId,
          companyName: passenger.companyName,
          pickupLocation: passenger.pickupLocation,
          dropLocation: passenger.dropLocation,
          status: passenger.status,
          taskDate: passenger.createdAt,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt
        };
        
        acc[empId].trips.push(transformedTrip);
        return acc;
      }, {});
      
      const employeesArray = Object.values(employees);
      console.log('✅ Found employees with details:', employeesArray.length);
      return employeesArray;
    } catch (error) {
      console.error('❌ Error fetching employees with details:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch employees with details');
    }
  },

  // Validate passenger data before sending to backend
  validatePassengerData: (passengerData) => {
    const errors = [];
    
    if (!passengerData.id) errors.push('Passenger ID is required');
    if (!passengerData.companyId) errors.push('Company ID is required');
    if (!passengerData.fleetTaskId) errors.push('Fleet Task ID is required');
    if (!passengerData.workerEmployeeId) errors.push('Worker Employee ID is required');
    if (!passengerData.employeeName) errors.push('Employee Name is required');
    if (!passengerData.employeeCode) errors.push('Employee Code is required');
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }
};

export default fleetTaskPassengerService;