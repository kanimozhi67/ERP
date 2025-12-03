import Driver from '../models/Driver.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';

/**
 * Validates driver input data with comprehensive business rules
 * @param {Object} data - Driver data to validate
 * @returns {Array} Array of validation errors
 */
const validateDriverInput = (data) => {
  const { companyId, employeeId, licenseNo, licenseExpiry, status } = data;
  const errors = [];

  // Required fields validation
  if (!companyId) errors.push('Company ID is required');
  if (!employeeId) errors.push('Employee ID is required');
  if (!licenseNo) errors.push('License number is required');

  // Data format validation
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (employeeId && isNaN(employeeId)) errors.push('Employee ID must be a number');

  // License validation
  if (licenseNo && licenseNo.trim().length === 0) {
    errors.push('License number cannot be empty');
  }

  // License expiry validation
  if (licenseExpiry) {
    const expiryDate = new Date(licenseExpiry);
    if (isNaN(expiryDate.getTime())) {
      errors.push('License expiry must be a valid date');
    } else if (expiryDate < new Date()) {
      errors.push('License expiry date cannot be in the past');
    }
  }

  // Status validation
  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
};

/**
 * Normalizes driver data for consistent storage
 * @param {Object} data - Raw driver data
 * @returns {Object} Normalized driver data
 */
const normalizeDriverData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.employeeId) normalized.employeeId = parseInt(normalized.employeeId, 10);
  if (normalized.vehicleId) normalized.vehicleId = parseInt(normalized.vehicleId, 10);

  // String sanitization
  if (normalized.licenseNo) normalized.licenseNo = normalized.licenseNo.trim().toUpperCase();
  if (normalized.employeeName) normalized.employeeName = normalized.employeeName.trim();
  if (normalized.employeeCode) normalized.employeeCode = normalized.employeeCode.trim();
  if (normalized.jobTitle) normalized.jobTitle = normalized.jobTitle.trim();

  // Date handling
  if (normalized.licenseExpiry) {
    const expiryDate = new Date(normalized.licenseExpiry);
    normalized.licenseExpiry = isNaN(expiryDate.getTime()) ? undefined : expiryDate;
  }

  // Default values
  if (!normalized.status) normalized.status = 'ACTIVE';
  normalized.updatedAt = new Date();

  return normalized;
};

/**
 * Generates next available driver ID
 * @returns {Promise<number>} Next driver ID
 */
const generateNextDriverId = async () => {
  try {
    const latestDriver = await Driver.findOne()
      .select('id')
      .sort({ id: -1 })
      .lean()
      .exec();
    
    return latestDriver ? latestDriver.id + 1 : 1;
  } catch (error) {
    console.error('Error generating driver ID:', error);
    throw new Error('Failed to generate driver ID');
  }
};

/**
 * Validates employee existence and retrieves employee data
 * @param {number} employeeId - Employee ID to validate
 * @returns {Promise<Object>} Employee data
 */
const validateEmployeeExistence = async (employeeId) => {
  const employee = await Employee.findOne({ id: employeeId })
    .select('fullName employeeCode jobTitle')
    .lean()
    .exec();

  if (!employee) {
    throw new Error(`Employee with ID ${employeeId} not found`);
  }

  return employee;
};

/**
 * Checks for existing active drivers for an employee
 * @param {number} employeeId - Employee ID to check
 * @param {string} status - New driver status
 * @param {number} excludeDriverId - Driver ID to exclude (for updates)
 * @returns {Promise<boolean>} True if active driver exists
 */
const checkExistingActiveDriver = async (employeeId, status, excludeDriverId = null) => {
  const query = { 
    employeeId: employeeId,
    status: 'ACTIVE'
  };

  if (excludeDriverId) {
    query.id = { $ne: excludeDriverId };
  }

  const existingDriver = await Driver.findOne(query)
    .select('_id')
    .lean()
    .exec();

  return !!existingDriver && status === 'ACTIVE';
};

/**
 * Creates a new driver with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createDriver = async (req, res) => {
  try {
    console.log('🚗 Creating new driver with data:', req.body);

    // Execute input validation
    const validationErrors = validateDriverInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeDriverData(req.body);

    // Execute parallel validations
    const [employee, existingActiveDriver, nextDriverId] = await Promise.all([
      validateEmployeeExistence(normalizedData.employeeId),
      checkExistingActiveDriver(normalizedData.employeeId, normalizedData.status),
      generateNextDriverId()
    ]);

    // Check for active driver conflict
    if (existingActiveDriver) {
      return res.status(409).json({
        success: false,
        message: `Active driver already exists for employee ${normalizedData.employeeId}`
      });
    }

    // Prepare driver document
    const driverData = {
      id: nextDriverId,
      companyId: normalizedData.companyId,
      employeeId: normalizedData.employeeId,
      employeeName: normalizedData.employeeName || employee.fullName,
      employeeCode: normalizedData.employeeCode || employee.employeeCode,
      jobTitle: normalizedData.jobTitle || employee.jobTitle,
      licenseNo: normalizedData.licenseNo,
      licenseExpiry: normalizedData.licenseExpiry,
      vehicleId: normalizedData.vehicleId,
      status: normalizedData.status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Creating driver with data:', driverData);

    // Persist driver document
    const driver = new Driver(driverData);
    await driver.save();

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'Driver created successfully',
      data: driver
    });

  } catch (error) {
    console.error('❌ Error creating driver:', error);
    
    // Handle specific error cases
    if (error.message.includes('Employee with ID')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Failed to generate driver ID')) {
      return res.status(500).json({
        success: false,
        message: 'System error: Unable to generate driver ID'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Error creating driver: ' + error.message
    });
  }
};

/**
 * Retrieves all drivers with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllDrivers = async (req, res) => {
  try {
    // Execute optimized query with field projection
    const drivers = await Driver.find()
      .select('id companyId employeeId employeeName employeeCode licenseNo licenseExpiry status createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(10000)
      .exec();

    // Return successful retrieval response
    return res.json({
      success: true,
      data: drivers,
      count: drivers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve drivers due to server error',
      error: error.message
    });
  }
};

/**
 * Retrieves specific driver by ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getDriverById = async (req, res) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    
    // Validate driver ID parameter
    if (isNaN(driverId) || driverId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID. Must be a positive integer.'
      });
    }

    // Execute optimized query
    const driver = await Driver.findOne({ id: driverId })
      .select('-__v')
      .lean()
      .exec();
    
    // Handle driver not found scenario
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID ${driverId} not found`
      });
    }

    // Return successful retrieval response
    return res.json({
      success: true,
      data: driver
    });

  } catch (error) {
    console.error(`❌ Error fetching driver ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve driver due to server error',
      error: error.message
    });
  }
};

/**
 * Updates existing driver with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateDriver = async (req, res) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    
    // Validate driver ID parameter
    if (isNaN(driverId) || driverId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID. Must be a positive integer.'
      });
    }

    // Normalize update data
    const updateData = normalizeDriverData(req.body);

    // Execute parallel validations
    const [existingDriver, employee, hasActiveDriverConflict] = await Promise.all([
      Driver.findOne({ id: driverId }).exec(),
      updateData.employeeId ? validateEmployeeExistence(updateData.employeeId) : Promise.resolve(null),
      updateData.employeeId && updateData.status ? 
        checkExistingActiveDriver(updateData.employeeId, updateData.status, driverId) : 
        Promise.resolve(false)
    ]);

    // Verify driver exists
    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID ${driverId} not found`
      });
    }

    // Check for active driver conflict
    if (hasActiveDriverConflict) {
      return res.status(409).json({
        success: false,
        message: `Active driver already exists for employee ${updateData.employeeId}`
      });
    }

    // Update employee information if employee changed
    if (employee && !updateData.employeeName) {
      updateData.employeeName = employee.fullName;
    }
    if (employee && !updateData.employeeCode) {
      updateData.employeeCode = employee.employeeCode;
    }
    if (employee && !updateData.jobTitle) {
      updateData.jobTitle = employee.jobTitle;
    }

    // Execute update operation
    const driver = await Driver.findOneAndUpdate(
      { id: driverId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    // Return successful update response
    return res.json({
      success: true,
      message: 'Driver updated successfully',
      data: driver
    });

  } catch (error) {
    console.error(`❌ Error updating driver ${req.params.id}:`, error);
    
    // Handle specific error cases
    if (error.message.includes('Employee with ID')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Error updating driver: ' + error.message
    });
  }
};

/**
 * Deletes driver by ID with proper validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteDriver = async (req, res) => {
  try {
    const driverId = parseInt(req.params.id, 10);
    
    // Validate driver ID parameter
    if (isNaN(driverId) || driverId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID. Must be a positive integer.'
      });
    }

    // Execute deletion operation
    const driver = await Driver.findOneAndDelete({ id: driverId });

    // Handle driver not found scenario
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: `Driver with ID ${driverId} not found`
      });
    }

    // Return successful deletion response
    return res.json({
      success: true,
      message: 'Driver deleted successfully',
      deletedDriver: {
        id: driver.id,
        employeeId: driver.employeeId,
        employeeName: driver.employeeName,
        licenseNo: driver.licenseNo
      }
    });

  } catch (error) {
    console.error(`❌ Error deleting driver ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete driver due to server error',
      error: error.message
    });
  }
};

/**
 * Retrieves drivers by company ID with flexible ID support
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getDriversByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log('🔍 Fetching drivers for company ID:', companyId, 'Type:', typeof companyId);

    let queryCompanyId;

    // Handle both numeric ID and MongoDB ObjectId
    if (typeof companyId === 'string' && companyId.length === 24) {
      console.log('📝 Detected MongoDB _id, finding numeric ID from company');
      
      const company = await Company.findOne({ _id: companyId })
        .select('id name')
        .lean()
        .exec();
        
      if (!company) {
        return res.status(404).json({
          success: false,
          message: `Company with _id ${companyId} not found`
        });
      }
      
      queryCompanyId = company.id;
      console.log('✅ Found company:', company.name, 'Numeric ID:', queryCompanyId);
    } else {
      queryCompanyId = parseInt(companyId, 10);
      if (isNaN(queryCompanyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid company ID. Must be a number or valid MongoDB _id.'
        });
      }
    }

    console.log('🔍 Querying drivers with companyId:', queryCompanyId);

    // Execute optimized query
    const drivers = await Driver.find({ companyId: queryCompanyId })
      .select('id employeeId employeeName employeeCode licenseNo licenseExpiry status vehicleId')
      .sort({ employeeName: 1 })
      .lean()
      .exec();

    console.log('✅ Found', drivers.length, 'drivers for company', queryCompanyId);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: drivers,
      count: drivers.length,
      companyId: queryCompanyId
    });

  } catch (error) {
    console.error('❌ Error fetching drivers by company:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve drivers by company due to server error',
      error: error.message
    });
  }
};

/**
 * Retrieves drivers by vehicle ID with optimized query
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getDriversByVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId, 10);
    
    // Validate vehicle ID parameter
    if (isNaN(vehicleId) || vehicleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID. Must be a positive integer.'
      });
    }

    // Execute optimized query
    const drivers = await Driver.find({ vehicleId: vehicleId })
      .select('id employeeId employeeName employeeCode licenseNo status')
      .sort({ status: -1, employeeName: 1 })
      .lean()
      .exec();
    
    // Return successful retrieval response
    return res.json({
      success: true,
      data: drivers,
      count: drivers.length,
      vehicleId: vehicleId
    });

  } catch (error) {
    console.error(`❌ Error fetching drivers for vehicle ${req.params.vehicleId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve drivers by vehicle due to server error',
      error: error.message
    });
  }
};

export {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriversByCompany,
  getDriversByVehicle
};