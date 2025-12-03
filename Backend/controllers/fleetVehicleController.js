import FleetVehicle from '../models/FleetVehicle.js';
import Company from '../models/Company.js';

/**
 * Validates fleet vehicle input data with comprehensive business rules
 * @param {Object} data - Fleet vehicle data to validate
 * @returns {Array} Array of validation errors
 */
const validateFleetVehicleInput = (data) => {
  const { 
     companyId, vehicleCode, registrationNo, capacity, 
    odometer, insuranceExpiry, lastServiceDate, status 
  } = data;
  const errors = [];

  // Required fields validation
  // if (!id) errors.push('Vehicle ID is required');
  if (!companyId) errors.push('Company ID is required');
  if (!vehicleCode) errors.push('Vehicle code is required');

  // Data type validation
  if (id && isNaN(id)) errors.push('Vehicle ID must be a number');
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (capacity && isNaN(capacity)) errors.push('Capacity must be a number');
  if (odometer && isNaN(odometer)) errors.push('Odometer reading must be a number');

  // String content validation
  if (vehicleCode && vehicleCode.trim().length === 0) {
    errors.push('Vehicle code cannot be empty');
  }
  if (vehicleCode && vehicleCode.trim().length > 20) {
    errors.push('Vehicle code must be less than 20 characters');
  }
  if (registrationNo && registrationNo.trim().length > 15) {
    errors.push('Registration number must be less than 15 characters');
  }

  // Capacity validation
  if (capacity && (capacity < 1 || capacity > 100)) {
    errors.push('Capacity must be between 1 and 100');
  }

  // Odometer validation
  if (odometer && odometer < 0) {
    errors.push('Odometer reading cannot be negative');
  }

  // Date validation
  if (insuranceExpiry) {
    const insuranceDate = new Date(insuranceExpiry);
    if (isNaN(insuranceDate.getTime())) {
      errors.push('Insurance expiry must be a valid date');
    }
  }

  if (lastServiceDate) {
    const serviceDate = new Date(lastServiceDate);
    if (isNaN(serviceDate.getTime())) {
      errors.push('Last service date must be a valid date');
    }
  }

  // Status validation
  const validStatuses = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
};

/**
 * Normalizes fleet vehicle data for consistent storage
 * @param {Object} data - Raw fleet vehicle data
 * @returns {Object} Normalized fleet vehicle data
 */
const normalizeFleetVehicleData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.id) normalized.id = parseInt(normalized.id, 10);
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.capacity) normalized.capacity = parseInt(normalized.capacity, 10);
  if (normalized.odometer) normalized.odometer = parseFloat(normalized.odometer);

  // String sanitization
  if (normalized.vehicleCode) normalized.vehicleCode = normalized.vehicleCode.trim().toUpperCase();
  if (normalized.registrationNo) normalized.registrationNo = normalized.registrationNo.trim().toUpperCase();
  if (normalized.vehicleType) normalized.vehicleType = normalized.vehicleType.trim();

  // Date handling with validation
  if (normalized.insuranceExpiry) {
    const insuranceDate = new Date(normalized.insuranceExpiry);
    normalized.insuranceExpiry = isNaN(insuranceDate.getTime()) ? null : insuranceDate;
  }

  if (normalized.lastServiceDate) {
    const serviceDate = new Date(normalized.lastServiceDate);
    normalized.lastServiceDate = isNaN(serviceDate.getTime()) ? null : serviceDate;
  }

  if (normalized.createdAt) {
    const createDate = new Date(normalized.createdAt);
    normalized.createdAt = isNaN(createDate.getTime()) ? new Date() : createDate;
  } else {
    normalized.createdAt = new Date();
  }

  // Default values
  if (!normalized.status) normalized.status = 'AVAILABLE';
  if (!normalized.meta) normalized.meta = {};

  return normalized;
};

/**
 * Validates referential integrity for company
 * @param {number} companyId - Company ID to validate
 * @returns {Promise<Object>} Validation results
 */
const validateCompanyExistence = async (companyId) => {
  const company = await Company.findOne({ id: companyId })
    .select('_id name tenantCode')
    .lean()
    .exec();

  return {
    exists: !!company,
    company
  };
};

/**
 * Checks for fleet vehicle uniqueness constraints
 * @param {number} vehicleId - Vehicle ID to check
 * @param {string} vehicleCode - Vehicle code to check
 * @param {string} registrationNo - Registration number to check (optional)
 * @param {number} excludeVehicleId - Vehicle ID to exclude (for updates)
 * @returns {Promise<Object>} Uniqueness validation results
 */
const checkFleetVehicleUniqueness = async (vehicleId, vehicleCode, registrationNo = null, excludeVehicleId = null) => {
  const queries = [];

  // Check ID uniqueness
  const idQuery = { id: vehicleId };
  if (excludeVehicleId) idQuery.id = { $ne: excludeVehicleId };
  queries.push(FleetVehicle.findOne(idQuery).select('_id').lean().exec());

  // Check vehicle code uniqueness
  const codeQuery = { vehicleCode: vehicleCode.trim().toUpperCase() };
  if (excludeVehicleId) codeQuery.id = { $ne: excludeVehicleId };
  queries.push(FleetVehicle.findOne(codeQuery).select('_id').lean().exec());

  // Check registration number uniqueness if provided
  if (registrationNo) {
    const regQuery = { registrationNo: registrationNo.trim().toUpperCase() };
    if (excludeVehicleId) regQuery.id = { $ne: excludeVehicleId };
    queries.push(FleetVehicle.findOne(regQuery).select('_id').lean().exec());
  }

  const [existingById, existingByCode, existingByReg] = await Promise.all(queries);

  const errors = [];
  if (existingById) errors.push(`Fleet vehicle with ID ${vehicleId} already exists`);
  if (existingByCode) errors.push(`Vehicle with code '${vehicleCode}' already exists`);
  if (existingByReg) errors.push(`Vehicle with registration number '${registrationNo}' already exists`);

  return { isValid: errors.length === 0, errors };
};

/**
 * Generates vehicle metadata based on vehicle parameters
 * @param {Object} vehicleData - Vehicle data for metadata generation
 * @returns {Object} Vehicle metadata
 */
const generateVehicleMetadata = (vehicleData) => {
  const metadata = {
    maintenanceStatus: 'GOOD',
    insuranceStatus: 'VALID',
    utilization: 'LOW',
    nextServiceDue: null,
    alerts: []
  };

  const currentDate = new Date();

  // Insurance status check
  if (vehicleData.insuranceExpiry) {
    const insuranceDate = new Date(vehicleData.insuranceExpiry);
    const daysUntilExpiry = Math.ceil((insuranceDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      metadata.insuranceStatus = 'EXPIRED';
      metadata.alerts.push('Insurance has expired');
    } else if (daysUntilExpiry <= 30) {
      metadata.insuranceStatus = 'EXPIRING_SOON';
      metadata.alerts.push(`Insurance expires in ${daysUntilExpiry} days`);
    }
  }

  // Maintenance status check
  if (vehicleData.lastServiceDate) {
    const serviceDate = new Date(vehicleData.lastServiceDate);
    const daysSinceService = Math.ceil((currentDate - serviceDate) / (1000 * 60 * 60 * 24));
    
    if (daysSinceService > 180) { // 6 months
      metadata.maintenanceStatus = 'DUE_FOR_SERVICE';
      metadata.alerts.push('Vehicle due for service');
      metadata.nextServiceDue = new Date(serviceDate.getTime() + (180 * 24 * 60 * 60 * 1000));
    } else if (daysSinceService > 120) { // 4 months
      metadata.maintenanceStatus = 'UPCOMING_SERVICE';
    }
  }

  // Odometer-based maintenance check
  if (vehicleData.odometer) {
    const lastServiceOdometer = vehicleData.meta?.lastServiceOdometer || 0;
    const odometerSinceService = vehicleData.odometer - lastServiceOdometer;
    
    if (odometerSinceService > 10000) { // 10,000 km threshold
      metadata.maintenanceStatus = 'DUE_FOR_SERVICE';
      metadata.alerts.push('Vehicle due for service based on odometer');
    }
  }

  // Status-based utilization
  if (vehicleData.status === 'IN_SERVICE') {
    metadata.utilization = 'HIGH';
  } else if (vehicleData.status === 'MAINTENANCE') {
    metadata.utilization = 'MAINTENANCE';
  }

  return metadata;
};

/**
 * Resolves company ID from various input formats
 * @param {string|number} companyId - Company ID input
 * @returns {Promise<Object>} Resolved company information
 */
const resolveCompanyId = async (companyId) => {
  // Check if companyId is a MongoDB _id (24 character hex string)
  if (typeof companyId === 'string' && /^[0-9a-fA-F]{24}$/.test(companyId)) {
    const company = await Company.findOne({ _id: companyId })
      .select('id name tenantCode')
      .lean()
      .exec();
    
    if (company) {
      return {
        resolvedId: company.id,
        company,
        source: 'mongoId'
      };
    }
  }

  // Try to parse as numeric ID
  const numericId = parseInt(companyId, 10);
  if (!isNaN(numericId) && numericId > 0) {
    const company = await Company.findOne({ id: numericId })
      .select('id name tenantCode')
      .lean()
      .exec();
    
    if (company) {
      return {
        resolvedId: numericId,
        company,
        source: 'numericId'
      };
    }
  }

  return {
    resolvedId: null,
    company: null,
    source: 'invalid'
  };
};

/**
 * Creates a new fleet vehicle with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createFleetVehicle = async (req, res) => {
  try {
    console.log('🚗 Executing fleet vehicle creation process...');

    // Execute input validation
    // const validationErrors = validateFleetVehicleInput(req.body);
    // if (validationErrors.length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: validationErrors.join(', ')
    //   });
    // }

    // Normalize input data
    const normalizedData = normalizeFleetVehicleData(req.body);

    // Resolve company ID
    const companyResolution = await resolveCompanyId(normalizedData.companyId);
    if (!companyResolution.resolvedId) {
      return res.status(400).json({
        success: false,
        message: `Company with ID ${normalizedData.companyId} does not exist`
      });
    }

    normalizedData.companyId = companyResolution.resolvedId;

    // Execute parallel validations
    const [uniquenessCheck] = await Promise.all([
      checkFleetVehicleUniqueness(
        normalizedData.id, 
        normalizedData.vehicleCode, 
        normalizedData.registrationNo
      )
    ]);

    // Handle uniqueness validation failure
    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', ')
      });
    }

    // Generate vehicle metadata
    const vehicleMetadata = generateVehicleMetadata(normalizedData);

    // Prepare fleet vehicle document
    const fleetVehicleData = {
      ...normalizedData,
      meta: { ...normalizedData.meta, ...vehicleMetadata },
      updatedAt: new Date()
    };

    console.log('✅ Fleet vehicle data validated, proceeding with creation...');

    // Persist fleet vehicle document
    const fleetVehicle = new FleetVehicle(fleetVehicleData);
    const savedVehicle = await fleetVehicle.save();

    console.log(`✅ Fleet vehicle creation successful: ${savedVehicle.vehicleCode} (ID: ${savedVehicle.id})`);

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'Fleet vehicle created successfully',
      data: savedVehicle,
      metadata: {
        maintenanceStatus: vehicleMetadata.maintenanceStatus,
        insuranceStatus: vehicleMetadata.insuranceStatus,
        alerts: vehicleMetadata.alerts
      }
    });

  } catch (error) {
    console.error('❌ Fleet vehicle creation process failed:', error);
    
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
        message: `Fleet vehicle with this ${field} already exists`
      });
    }

    // Return generic server error response
    return res.status(500).json({
      success: false,
      message: 'Server error during fleet vehicle creation: ' + error.message
    });
  }
};

/**
 * Retrieves all fleet vehicles with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetVehicles = async (req, res) => {
  try {
    console.log('🔍 Executing fleet vehicle retrieval process...');

    // Execute optimized query with field projection
    const fleetVehicles = await FleetVehicle.find()
      .select('id companyId vehicleCode registrationNo vehicleType capacity status odometer meta createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(10000)
      .exec();
    
    console.log(`✅ Fleet vehicle retrieval successful: ${fleetVehicles.length} vehicles processed`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: fleetVehicles.length,
      data: fleetVehicles,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fleet vehicle retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet vehicle retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves specific fleet vehicle by ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetVehicleById = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    
    // Validate vehicle ID parameter
    if (isNaN(vehicleId) || vehicleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a positive integer.'
      });
    }

    console.log(`🔍 Executing fleet vehicle retrieval for ID: ${vehicleId}`);

    // Execute optimized query
    const fleetVehicle = await FleetVehicle.findOne({ id: vehicleId })
      .select('-__v')
      .lean()
      .exec();
    
    // Handle vehicle not found scenario
    if (!fleetVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    console.log(`✅ Fleet vehicle retrieval successful: ${fleetVehicle.vehicleCode}`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: fleetVehicle
    });

  } catch (error) {
    console.error(`❌ Fleet vehicle retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet vehicle retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves fleet vehicles by company ID with flexible ID resolution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetVehiclesByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    console.log(`🔍 Executing fleet vehicle retrieval for company: ${companyId}`);

    // Resolve company ID
    const companyResolution = await resolveCompanyId(companyId);
    if (!companyResolution.resolvedId) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`
      });
    }

    console.log(`✅ Resolved company ID: ${companyResolution.resolvedId} (${companyResolution.source})`);

    // Execute optimized query
    const fleetVehicles = await FleetVehicle.find({ companyId: companyResolution.resolvedId })
      .select('id vehicleCode registrationNo vehicleType capacity status odometer meta createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Company fleet vehicle retrieval successful: ${fleetVehicles.length} vehicles found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: fleetVehicles.length,
      company: {
        id: companyResolution.company.id,
        name: companyResolution.company.name,
        tenantCode: companyResolution.company.tenantCode
      },
      data: fleetVehicles
    });

  } catch (error) {
    console.error('❌ Company fleet vehicle retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company fleet vehicle retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves fleet vehicles by status with validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetVehiclesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'OUT_OF_SERVICE'];
    
    // Validate status parameter
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    console.log(`🔍 Executing fleet vehicle retrieval for status: ${status}`);

    // Execute optimized query
    const fleetVehicles = await FleetVehicle.find({ status: status.toUpperCase() })
      .select('id companyId vehicleCode registrationNo vehicleType capacity odometer meta createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Status-based fleet vehicle retrieval successful: ${fleetVehicles.length} vehicles found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: fleetVehicles.length,
      status: status.toUpperCase(),
      data: fleetVehicles
    });

  } catch (error) {
    console.error('❌ Status-based fleet vehicle retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status-based fleet vehicle retrieval: ' + error.message
    });
  }
};

/**
 * Updates existing fleet vehicle with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateFleetVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    
    // Validate vehicle ID parameter
    if (isNaN(vehicleId) || vehicleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a positive integer.'
      });
    }

    console.log(`✏️ Executing fleet vehicle update process for ID: ${vehicleId}`);

    // Normalize update data
    const updateData = normalizeFleetVehicleData(req.body);
    updateData.updatedAt = new Date();

    // Execute parallel validations
    const [existingVehicle, uniquenessCheck] = await Promise.all([
      FleetVehicle.findOne({ id: vehicleId }).exec(),
      (updateData.vehicleCode || updateData.registrationNo) ? 
        checkFleetVehicleUniqueness(
          vehicleId,
          updateData.vehicleCode || existingVehicle?.vehicleCode,
          updateData.registrationNo || existingVehicle?.registrationNo,
          vehicleId
        ) : 
        Promise.resolve({ isValid: true, errors: [] })
    ]);

    // Verify vehicle exists
    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    // Handle uniqueness validation failure
    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', ')
      });
    }

    // Generate updated metadata if relevant fields changed
    const metadataFields = ['insuranceExpiry', 'lastServiceDate', 'odometer', 'status'];
    const shouldUpdateMetadata = metadataFields.some(field => updateData[field] !== undefined);
    
    if (shouldUpdateMetadata) {
      const mergedData = { ...existingVehicle.toObject(), ...updateData };
      updateData.meta = { ...existingVehicle.meta, ...generateVehicleMetadata(mergedData) };
    }

    // Execute update operation
    const fleetVehicle = await FleetVehicle.findOneAndUpdate(
      { id: vehicleId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    console.log(`✅ Fleet vehicle update successful: ${fleetVehicle.vehicleCode}`);

    // Return successful update response
    return res.json({
      success: true,
      message: 'Fleet vehicle updated successfully',
      data: fleetVehicle
    });

  } catch (error) {
    console.error(`❌ Fleet vehicle update process failed for ID ${req.params.id}:`, error);
    
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
 * Deletes fleet vehicle by ID with proper validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteFleetVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id, 10);
    
    // Validate vehicle ID parameter
    if (isNaN(vehicleId) || vehicleId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fleet vehicle ID. Must be a positive integer.'
      });
    }

    console.log(`🗑️ Executing fleet vehicle deletion process for ID: ${vehicleId}`);

    // Execute deletion operation
    const fleetVehicle = await FleetVehicle.findOneAndDelete({ id: vehicleId });

    // Handle vehicle not found scenario
    if (!fleetVehicle) {
      return res.status(404).json({
        success: false,
        message: `Fleet vehicle with ID ${vehicleId} not found`
      });
    }

    console.log(`✅ Fleet vehicle deletion successful: ${fleetVehicle.vehicleCode}`);

    // Return successful deletion response
    return res.json({
      success: true,
      message: 'Fleet vehicle deleted successfully',
      deletedVehicle: {
        id: fleetVehicle.id,
        vehicleCode: fleetVehicle.vehicleCode,
        registrationNo: fleetVehicle.registrationNo,
        companyId: fleetVehicle.companyId,
        status: fleetVehicle.status,
        createdAt: fleetVehicle.createdAt
      }
    });

  } catch (error) {
    console.error(`❌ Fleet vehicle deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet vehicle deletion: ' + error.message
    });
  }
};

export{
  createFleetVehicle,
  getFleetVehicles,
  getFleetVehicleById,
  getFleetVehiclesByCompany,
  getFleetVehiclesByStatus,
  updateFleetVehicle,
  deleteFleetVehicle
};