import FleetTaskPassenger from '../models/FleetTaskPassenger.js';
import Company from '../models/Company.js';
import FleetTask from '../models/FleetTask.js';
import Employee from '../models/Employee.js';

/**
 * Validates fleet task passenger input data with comprehensive business rules
 * @param {Object} data - Fleet task passenger data to validate
 * @returns {Array} Array of validation errors
 */
const validateFleetTaskPassengerInput = (data) => {
  const { 
    id, companyId, fleetTaskId, workerEmployeeId, employeeName,
    pickupConfirmedAt, dropConfirmedAt, status 
  } = data;
  const errors = [];

  // Required fields validation
  if (!id) errors.push('Passenger ID is required');
  if (!companyId) errors.push('Company ID is required');
  if (!fleetTaskId) errors.push('Fleet task ID is required');
  if (!workerEmployeeId) errors.push('Worker employee ID is required');

  // Data type validation
  if (id && isNaN(id)) errors.push('Passenger ID must be a number');
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (fleetTaskId && isNaN(fleetTaskId)) errors.push('Fleet task ID must be a number');
  if (workerEmployeeId && isNaN(workerEmployeeId)) errors.push('Worker employee ID must be a number');

  // Employee name validation
  if (employeeName && employeeName.trim().length === 0) {
    errors.push('Employee name cannot be empty');
  }
  if (employeeName && employeeName.trim().length > 100) {
    errors.push('Employee name must be less than 100 characters');
  }

  // Date validation
  if (pickupConfirmedAt) {
    const pickupDate = new Date(pickupConfirmedAt);
    if (isNaN(pickupDate.getTime())) {
      errors.push('Pickup confirmed date must be a valid date');
    }
  }

  if (dropConfirmedAt) {
    const dropDate = new Date(dropConfirmedAt);
    if (isNaN(dropDate.getTime())) {
      errors.push('Drop confirmed date must be a valid date');
    }
  }

  // Status validation
  const validStatuses = ['PLANNED', 'PICKED', 'DROPPED', 'ABSENT'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Business logic validation
  if (dropConfirmedAt && !pickupConfirmedAt) {
    errors.push('Cannot have drop confirmation without pickup confirmation');
  }

  if (pickupConfirmedAt && dropConfirmedAt) {
    const pickupTime = new Date(pickupConfirmedAt);
    const dropTime = new Date(dropConfirmedAt);
    if (dropTime <= pickupTime) {
      errors.push('Drop time must be after pickup time');
    }
  }

  return errors;
};

/**
 * Normalizes fleet task passenger data for consistent storage
 * @param {Object} data - Raw fleet task passenger data
 * @returns {Object} Normalized fleet task passenger data
 */
const normalizeFleetTaskPassengerData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.id) normalized.id = parseInt(normalized.id, 10);
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.fleetTaskId) normalized.fleetTaskId = parseInt(normalized.fleetTaskId, 10);
  if (normalized.workerEmployeeId) normalized.workerEmployeeId = parseInt(normalized.workerEmployeeId, 10);

  // String sanitization
  if (normalized.employeeName) normalized.employeeName = normalized.employeeName.trim().replace(/\s+/g, ' ');
  if (normalized.employeeCode) normalized.employeeCode = normalized.employeeCode.trim();
  if (normalized.department) normalized.department = normalized.department.trim();
  if (normalized.notes) normalized.notes = normalized.notes.trim();

  // Date handling with validation (FIXED: Proper timezone handling)
  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  };

  if (normalized.pickupConfirmedAt) {
    normalized.pickupConfirmedAt = formatDateTime(normalized.pickupConfirmedAt);
  }

  if (normalized.dropConfirmedAt) {
    normalized.dropConfirmedAt = formatDateTime(normalized.dropConfirmedAt);
  }

  if (normalized.createdAt) {
    const createDate = new Date(normalized.createdAt);
    normalized.createdAt = isNaN(createDate.getTime()) ? new Date() : createDate;
  } else {
    normalized.createdAt = new Date();
  }

  // Default values
  if (!normalized.status) normalized.status = 'PLANNED';
  if (!normalized.employeeName) normalized.employeeName = 'Unknown Employee';
  if (!normalized.employeeCode) normalized.employeeCode = '';
  if (!normalized.department) normalized.department = '';

  return normalized;
};

/**
 * Validates referential integrity for related entities - REMOVED EMPLOYEE VALIDATION
 * @param {number} companyId - Company ID to validate
 * @param {number} fleetTaskId - Fleet task ID to validate
 * @returns {Promise<Object>} Validation results
 */
const validateReferentialIntegrity = async (companyId, fleetTaskId) => {
  const validationPromises = [
    Company.findOne({ id: companyId }).select('_id name tenantCode').lean().exec(),
    FleetTask.findOne({ id: fleetTaskId }).select('_id taskDate vehicleId driverId').lean().exec()
  ];

  const [company, fleetTask] = await Promise.all(validationPromises);

  const errors = [];
  if (!company) errors.push(`Company with ID ${companyId} does not exist`);
  if (!fleetTask) errors.push(`Fleet task with ID ${fleetTaskId} does not exist`);

  return { 
    isValid: errors.length === 0, 
    errors,
    company,
    fleetTask
  };
};

/**
 * Checks for fleet task passenger uniqueness constraints
 * @param {number} passengerId - Passenger ID to check
 * @returns {Promise<boolean>} True if passenger ID is unique
 */
const checkFleetTaskPassengerUniqueness = async (passengerId) => {
  const existingPassenger = await FleetTaskPassenger.findOne({ id: passengerId })
    .select('_id')
    .lean()
    .exec();

  return !existingPassenger;
};

/**
 * Generates passenger metadata based on passenger data
 * @param {Object} passengerData - Passenger data for metadata generation
 * @returns {Object} Passenger metadata
 */
const generatePassengerMetadata = (passengerData) => {
  const metadata = {
    journeyStatus: 'PENDING',
    requiresAttention: false,
    timeMetrics: {}
  };

  // Set journey status based on confirmation times
  if (passengerData.pickupConfirmedAt && passengerData.dropConfirmedAt) {
    metadata.journeyStatus = 'COMPLETED';
  } else if (passengerData.pickupConfirmedAt) {
    metadata.journeyStatus = 'IN_TRANSIT';
  } else {
    metadata.journeyStatus = 'PENDING';
  }

  // Calculate time metrics if both pickup and drop times are available
  if (passengerData.pickupConfirmedAt && passengerData.dropConfirmedAt) {
    const pickupTime = new Date(passengerData.pickupConfirmedAt);
    const dropTime = new Date(passengerData.dropConfirmedAt);
    const journeyDuration = Math.round((dropTime - pickupTime) / (1000 * 60)); // minutes
    
    metadata.timeMetrics = {
      journeyDuration,
      pickupTime: pickupTime.toISOString(),
      dropTime: dropTime.toISOString()
    };
  }

  // Set attention flag for overdue pickups
  if (passengerData.status === 'PLANNED' && passengerData.createdAt) {
    const createdTime = new Date(passengerData.createdAt);
    const currentTime = new Date();
    const hoursSinceCreation = (currentTime - createdTime) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      metadata.requiresAttention = true;
    }
  }

  return metadata;
};

/**
 * Creates a new fleet task passenger with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createFleetTaskPassenger = async (req, res) => {
  try {
    console.log('👤 Executing fleet task passenger creation process...');

    // Execute input validation
    const validationErrors = validateFleetTaskPassengerInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeFleetTaskPassengerData(req.body);

    // Execute parallel validations
    const [isPassengerIdUnique, referentialCheck] = await Promise.all([
      checkFleetTaskPassengerUniqueness(normalizedData.id),
      validateReferentialIntegrity(
        normalizedData.companyId, 
        normalizedData.fleetTaskId
      )
    ]);

    // Handle uniqueness validation failure
    if (!isPassengerIdUnique) {
      return res.status(409).json({
        success: false,
        message: `Fleet task passenger with ID ${normalizedData.id} already exists`
      });
    }

    // Handle referential integrity validation failure
    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', ')
      });
    }

    // Generate passenger metadata
    const passengerMetadata = generatePassengerMetadata(normalizedData);

    // Prepare fleet task passenger document
    const fleetTaskPassengerData = {
      ...normalizedData,
      metadata: passengerMetadata,
      updatedAt: new Date()
    };

    console.log('✅ Fleet task passenger data validated, proceeding with creation...');

    // Persist fleet task passenger document
    const fleetTaskPassenger = new FleetTaskPassenger(fleetTaskPassengerData);
    const savedPassenger = await fleetTaskPassenger.save();

    console.log(`✅ Fleet task passenger creation successful: ${savedPassenger.employeeName} (ID: ${savedPassenger.id})`);

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'Fleet task passenger created successfully',
      data: savedPassenger,
      metadata: {
        journeyStatus: passengerMetadata.journeyStatus,
        requiresAttention: passengerMetadata.requiresAttention
      }
    });

  } catch (error) {
    console.error('❌ Fleet task passenger creation process failed:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error',
        errors: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Fleet task passenger with this ${field} already exists`
      });
    }

    // Return generic server error response
    return res.status(500).json({
      success: false,
      message: 'Server error during fleet task passenger creation: ' + error.message
    });
  }
};

/**
 * Retrieves all fleet task passengers with enhanced querying and related data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetTaskPassengers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      companyId,
      fleetTaskId,
      workerEmployeeId,
      status,
      dateFrom,
      dateTo
    } = req.query;

    console.log('🔍 Executing enhanced fleet task passenger retrieval process...');

    // Build comprehensive filter object
    const filter = {};
    
    if (companyId) filter.companyId = parseInt(companyId, 10);
    if (fleetTaskId) filter.fleetTaskId = parseInt(fleetTaskId, 10);
    if (workerEmployeeId) filter.workerEmployeeId = parseInt(workerEmployeeId, 10);
    if (status) filter.status = status;

    // Date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    // Execute optimized query with pagination
    const [passengers, total] = await Promise.all([
      FleetTaskPassenger.find(filter)
        .select('id companyId fleetTaskId workerEmployeeId employeeName employeeCode status pickupConfirmedAt dropConfirmedAt metadata createdAt')
        .limit(limit * 1)
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      FleetTaskPassenger.countDocuments(filter)
    ]);

    // Enhanced: Get related data for each passenger
    const passengersWithDetails = await Promise.all(
      passengers.map(async (passenger) => {
        const [company, fleetTask] = await Promise.all([
          Company.findOne({ id: passenger.companyId }).select('name tenantCode').lean().exec(),
          FleetTask.findOne({ id: passenger.fleetTaskId }).select('taskDate vehicleId driverId').lean().exec()
        ]);

        return {
          ...passenger,
          companyName: company ? company.name : 'Unknown Company',
          tenantCode: company ? company.tenantCode : 'N/A',
          taskDate: fleetTask ? fleetTask.taskDate : null,
          vehicleId: fleetTask ? fleetTask.vehicleId : null,
          driverId: fleetTask ? fleetTask.driverId : null
        };
      })
    );

    console.log(`✅ Enhanced fleet task passenger retrieval successful: ${passengers.length} passengers processed`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: passengersWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced fleet task passenger retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet task passenger retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves specific fleet task passenger by ID with enhanced data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetTaskPassengerById = async (req, res) => {
  try {
    let passenger;
    
    // Handle both numeric ID and MongoDB ID
    if (req.params.id.match(/^[0-9]+$/)) {
      passenger = await FleetTaskPassenger.findOne({ id: parseInt(req.params.id, 10) });
    } else {
      passenger = await FleetTaskPassenger.findById(req.params.id);
    }

    // Handle passenger not found scenario
    if (!passenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${req.params.id} not found`
      });
    }

    console.log(`🔍 Executing fleet task passenger retrieval for ID: ${req.params.id}`);

    // Enhanced: Get related data
    const [company, fleetTask] = await Promise.all([
      Company.findOne({ id: passenger.companyId }).select('name tenantCode').lean().exec(),
      FleetTask.findOne({ id: passenger.fleetTaskId }).select('taskDate vehicleId driverId pickupLocation dropLocation').lean().exec()
    ]);

    const passengerWithDetails = {
      ...passenger.toObject(),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A',
      taskDetails: fleetTask ? {
        taskDate: fleetTask.taskDate,
        vehicleId: fleetTask.vehicleId,
        driverId: fleetTask.driverId,
        pickupLocation: fleetTask.pickupLocation,
        dropLocation: fleetTask.dropLocation
      } : null
    };

    console.log(`✅ Fleet task passenger retrieval successful: ${passenger.employeeName}`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: passengerWithDetails
    });

  } catch (error) {
    console.error(`❌ Fleet task passenger retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet task passenger retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves fleet task passengers by task ID with enhanced data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetTaskPassengersByTaskId = async (req, res) => {
  try {
    let taskId;
    
    // Handle both numeric ID and MongoDB ID
    if (req.params.taskId.match(/^[0-9]+$/)) {
      taskId = parseInt(req.params.taskId, 10);
    } else {
      // If it's a MongoDB ID, find the task first to get numeric ID
      const task = await FleetTask.findById(req.params.taskId).select('id').lean().exec();
      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Fleet task with ID ${req.params.taskId} not found`
        });
      }
      taskId = task.id;
    }

    console.log(`🔍 Executing passenger retrieval for task ID: ${taskId}`);

    // Execute parallel validations and query
    const [fleetTask, passengers] = await Promise.all([
      FleetTask.findOne({ id: taskId })
        .select('id taskDate vehicleId driverId pickupLocation dropLocation companyId')
        .lean()
        .exec(),
      FleetTaskPassenger.find({ fleetTaskId: taskId })
        .select('id workerEmployeeId employeeName employeeCode status pickupConfirmedAt dropConfirmedAt metadata createdAt')
        .sort({ createdAt: -1 })
        .lean()
        .exec()
    ]);

    // Handle fleet task not found scenario
    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: `Fleet task with ID ${taskId} not found`
      });
    }

    console.log(`✅ Enhanced task passenger retrieval successful: ${passengers.length} passengers found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: passengers.length,
      task: {
        id: fleetTask.id,
        taskDate: fleetTask.taskDate,
        vehicleId: fleetTask.vehicleId,
        driverId: fleetTask.driverId,
        pickupLocation: fleetTask.pickupLocation,
        dropLocation: fleetTask.dropLocation,
        companyId: fleetTask.companyId
      },
      data: passengers
    });

  } catch (error) {
    console.error('❌ Enhanced task passenger retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during task passenger retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves fleet task passengers by company ID with enhanced data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetTaskPassengersByCompany = async (req, res) => {
  try {
    let companyId;
    
    // Handle both numeric ID and MongoDB ID
    if (req.params.companyId.match(/^[0-9]+$/)) {
      companyId = parseInt(req.params.companyId, 10);
    } else {
      // If it's a MongoDB ID, find the company first to get numeric ID
      const company = await Company.findById(req.params.companyId).select('id').lean().exec();
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Company with ID ${req.params.companyId} not found`
        });
      }
      companyId = company.id;
    }

    console.log(`🔍 Executing passenger retrieval for company ID: ${companyId}`);

    // Execute parallel validations and query
    const [company, passengers] = await Promise.all([
      Company.findOne({ id: companyId }).select('name tenantCode').lean().exec(),
      FleetTaskPassenger.find({ companyId: companyId })
        .select('id fleetTaskId workerEmployeeId employeeName employeeCode status pickupConfirmedAt dropConfirmedAt createdAt')
        .sort({ createdAt: -1 })
        .lean()
        .exec()
    ]);

    // Handle company not found scenario
    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`
      });
    }

    console.log(`✅ Enhanced company passenger retrieval successful: ${passengers.length} passengers found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: passengers.length,
      company: {
        id: companyId,
        name: company.name,
        tenantCode: company.tenantCode
      },
      data: passengers
    });

  } catch (error) {
    console.error('❌ Enhanced company passenger retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company passenger retrieval: ' + error.message
    });
  }
};

/**
 * Updates existing fleet task passenger with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateFleetTaskPassenger = async (req, res) => {
  try {
    let passengerId;
    
    // Handle both numeric ID and MongoDB ID
    if (req.params.id.match(/^[0-9]+$/)) {
      passengerId = parseInt(req.params.id, 10);
    } else {
      // If it's a MongoDB ID, find the passenger first to get numeric ID
      const passenger = await FleetTaskPassenger.findById(req.params.id).select('id').exec();
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: `Fleet task passenger with ID ${req.params.id} not found`
        });
      }
      passengerId = passenger.id;
    }

    console.log(`✏️ Executing fleet task passenger update process for ID: ${passengerId}`);

    // Normalize update data with proper date handling
    const updateData = normalizeFleetTaskPassengerData(req.body);
    updateData.updatedAt = new Date();

    // Execute parallel validations
    const [existingPassenger, referentialCheck] = await Promise.all([
      FleetTaskPassenger.findOne({ id: passengerId }).exec(),
      (updateData.companyId || updateData.fleetTaskId) ? 
        validateReferentialIntegrity(
          updateData.companyId || existingPassenger?.companyId,
          updateData.fleetTaskId || existingPassenger?.fleetTaskId
        ) : 
        Promise.resolve({ isValid: true, errors: [] })
    ]);

    // Verify passenger exists
    if (!existingPassenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${passengerId} not found`
      });
    }

    // Handle referential integrity validation failure
    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', ')
      });
    }

    // Generate updated metadata if relevant fields changed
    const metadataFields = ['pickupConfirmedAt', 'dropConfirmedAt', 'status'];
    const shouldUpdateMetadata = metadataFields.some(field => updateData[field] !== undefined);
    
    if (shouldUpdateMetadata) {
      const mergedData = { ...existingPassenger.toObject(), ...updateData };
      updateData.metadata = { 
        ...existingPassenger.metadata, 
        ...generatePassengerMetadata(mergedData) 
      };
    }

    let updatedPassenger;
    
    // Update based on ID type
    if (req.params.id.match(/^[0-9]+$/)) {
      updatedPassenger = await FleetTaskPassenger.findOneAndUpdate(
        { id: passengerId },
        updateData,
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      );
    } else {
      updatedPassenger = await FleetTaskPassenger.findByIdAndUpdate(
        req.params.id,
        updateData,
        { 
          new: true, 
          runValidators: true,
          context: 'query'
        }
      );
    }

    console.log(`✅ Fleet task passenger update successful: ${updatedPassenger.employeeName}`);

    // Return successful update response
    return res.json({
      success: true,
      message: 'Fleet task passenger updated successfully',
      data: updatedPassenger
    });

  } catch (error) {
    console.error(`❌ Fleet task passenger update process failed for ID ${req.params.id}:`, error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error during update',
        errors: errors
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Update process failed: ' + error.message
    });
  }
};

/**
 * Deletes fleet task passenger by ID with proper validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteFleetTaskPassenger = async (req, res) => {
  try {
    let deletedPassenger;
    
    // Handle both numeric ID and MongoDB ID
    if (req.params.id.match(/^[0-9]+$/)) {
      deletedPassenger = await FleetTaskPassenger.findOneAndDelete({ id: parseInt(req.params.id, 10) });
    } else {
      deletedPassenger = await FleetTaskPassenger.findByIdAndDelete(req.params.id);
    }

    // Handle passenger not found scenario
    if (!deletedPassenger) {
      return res.status(404).json({
        success: false,
        message: `Fleet task passenger with ID ${req.params.id} not found`
      });
    }

    console.log(`🗑️ Executing fleet task passenger deletion process for ID: ${req.params.id}`);
    console.log(`✅ Fleet task passenger deletion successful: ${deletedPassenger.employeeName}`);

    // Return successful deletion response
    return res.json({
      success: true,
      message: 'Fleet task passenger deleted successfully',
      deletedPassenger: {
        id: deletedPassenger.id,
        fleetTaskId: deletedPassenger.fleetTaskId,
        workerEmployeeId: deletedPassenger.workerEmployeeId,
        employeeName: deletedPassenger.employeeName,
        createdAt: deletedPassenger.createdAt
      }
    });

  } catch (error) {
    console.error(`❌ Fleet task passenger deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet task passenger deletion: ' + error.message
    });
  }
};

/**
 * Deletes all fleet task passengers by task ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteFleetTaskPassengersByTaskId = async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    
    console.log(`🗑️ Executing bulk passenger deletion for task ID: ${taskId}`);

    const result = await FleetTaskPassenger.deleteMany({ fleetTaskId: taskId });

    console.log(`✅ Bulk passenger deletion successful: ${result.deletedCount} passengers deleted`);

    return res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} passengers for task ${taskId}`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error(`❌ Bulk passenger deletion failed for task ID ${req.params.taskId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during bulk passenger deletion: ' + error.message
    });
  }
};

export {
  createFleetTaskPassenger,
  getFleetTaskPassengers,
  getFleetTaskPassengerById,
  getFleetTaskPassengersByTaskId,
  getFleetTaskPassengersByCompany,
  updateFleetTaskPassenger,
  deleteFleetTaskPassenger,
  deleteFleetTaskPassengersByTaskId
};