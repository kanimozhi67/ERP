import FleetAlert from '../models/FleetAlert.js';
import Company from '../models/Company.js';
import FleetVehicle from '../models/FleetVehicle.js';
import User from '../models/User.js';
/**
 * Validates fleet alert input data with comprehensive business rules
 * @param {Object} data - Fleet alert data to validate
 * @returns {Array} Array of validation errors
 */
const validateFleetAlertInput = (data) => {
  const { id, companyId, vehicleId, alertType, alertMessage, alertDate, resolvedAt, createdBy } = data;
  const errors = [];

  // Required fields validation
  if (!id) errors.push('Alert ID is required');
  if (!companyId) errors.push('Company ID is required');

  // Data type validation
  if (id && isNaN(id)) errors.push('Alert ID must be a number');
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (vehicleId && isNaN(vehicleId)) errors.push('Vehicle ID must be a number');
  if (createdBy && isNaN(createdBy)) errors.push('CreatedBy user ID must be a number');

  // Alert type validation
  const validAlertTypes = ['MAINTENANCE', 'SAFETY', 'PERFORMANCE', 'COMPLIANCE', 'OTHER'];
  if (alertType && !validAlertTypes.includes(alertType)) {
    errors.push(`Alert type must be one of: ${validAlertTypes.join(', ')}`);
  }

  // Alert message validation
  if (alertMessage && alertMessage.trim().length === 0) {
    errors.push('Alert message cannot be empty');
  }
  if (alertMessage && alertMessage.trim().length > 500) {
    errors.push('Alert message must be less than 500 characters');
  }

  // Date validation
  if (alertDate) {
    const alertDateObj = new Date(alertDate);
    if (isNaN(alertDateObj.getTime())) {
      errors.push('Alert date must be a valid date');
    } else if (alertDateObj > new Date()) {
      errors.push('Alert date cannot be in the future');
    }
  }

  if (resolvedAt) {
    const resolvedAtObj = new Date(resolvedAt);
    if (isNaN(resolvedAtObj.getTime())) {
      errors.push('Resolved date must be a valid date');
    }
  }

  return errors;
};

/**
 * Normalizes fleet alert data for consistent storage
 * @param {Object} data - Raw fleet alert data
 * @returns {Object} Normalized fleet alert data
 */
const normalizeFleetAlertData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.id) normalized.id = parseInt(normalized.id, 10);
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.vehicleId) normalized.vehicleId = parseInt(normalized.vehicleId, 10);
  if (normalized.createdBy) normalized.createdBy = parseInt(normalized.createdBy, 10);

  // String sanitization
  if (normalized.alertType) normalized.alertType = normalized.alertType.trim().toUpperCase();
  if (normalized.alertMessage) normalized.alertMessage = normalized.alertMessage.trim();

  // Date handling with validation
  if (normalized.alertDate) {
    const alertDate = new Date(normalized.alertDate);
    normalized.alertDate = isNaN(alertDate.getTime()) ? new Date() : alertDate;
  } else {
    normalized.alertDate = new Date();
  }

  if (normalized.resolvedAt) {
    const resolvedAt = new Date(normalized.resolvedAt);
    normalized.resolvedAt = isNaN(resolvedAt.getTime()) ? null : resolvedAt;
  }

  return normalized;
};

/**
 * Validates referential integrity for related entities
 * @param {number} companyId - Company ID to validate
 * @param {number} vehicleId - Vehicle ID to validate (optional)
 * @param {number} createdBy - User ID to validate (optional)
 * @returns {Promise<Object>} Validation results
 */
const validateReferentialIntegrity = async (companyId, vehicleId = null, createdBy = null) => {
  const validationPromises = [];

  // Always validate company
  validationPromises.push(
    Company.findOne({ id: companyId }).select('_id name').lean().exec()
  );

  // Validate vehicle if provided
  if (vehicleId) {
    validationPromises.push(
      FleetVehicle.findOne({ id: vehicleId }).select('_id vehicleNumber').lean().exec()
    );
  } else {
    validationPromises.push(Promise.resolve(true));
  }

  // Validate user if provided
  if (createdBy) {
    validationPromises.push(
      User.findOne({ id: createdBy }).select('_id username').lean().exec()
    );
  } else {
    validationPromises.push(Promise.resolve(true));
  }

  const [company, vehicle, user] = await Promise.all(validationPromises);

  const errors = [];
  if (!company) errors.push(`Company with ID ${companyId} does not exist`);
  if (vehicleId && !vehicle) errors.push(`Fleet vehicle with ID ${vehicleId} does not exist`);
  if (createdBy && !user) errors.push(`User with ID ${createdBy} does not exist`);

  return { 
    isValid: errors.length === 0, 
    errors,
    company,
    vehicle,
    user
  };
};

/**
 * Checks for fleet alert uniqueness constraints
 * @param {number} alertId - Alert ID to check
 * @returns {Promise<boolean>} True if alert ID is unique
 */
const checkFleetAlertUniqueness = async (alertId) => {
  const existingAlert = await FleetAlert.findOne({ id: alertId })
    .select('_id')
    .lean()
    .exec();

  return !existingAlert;
};

/**
 * Generates alert metadata based on alert type and content
 * @param {string} alertType - Type of alert
 * @param {string} alertMessage - Alert message content
 * @returns {Object} Alert metadata
 */
const generateAlertMetadata = (alertType, alertMessage) => {
  const metadata = {
    priority: 'MEDIUM',
    category: 'GENERAL',
    autoResolve: false
  };

  // Set priority based on alert type
  const priorityMap = {
    'SAFETY': 'HIGH',
    'COMPLIANCE': 'HIGH',
    'MAINTENANCE': 'MEDIUM',
    'PERFORMANCE': 'LOW',
    'OTHER': 'LOW'
  };

  metadata.priority = priorityMap[alertType] || 'MEDIUM';

  // Set category based on alert content
  if (alertMessage) {
    const message = alertMessage.toLowerCase();
    if (message.includes('urgent') || message.includes('critical')) {
      metadata.priority = 'HIGH';
    }
    if (message.includes('engine') || message.includes('motor')) {
      metadata.category = 'ENGINE';
    } else if (message.includes('brake') || message.includes('tire')) {
      metadata.category = 'SAFETY_SYSTEM';
    } else if (message.includes('document') || message.includes('license')) {
      metadata.category = 'COMPLIANCE';
    }
  }

  // Set auto-resolve for low priority alerts
  metadata.autoResolve = metadata.priority === 'LOW';

  return metadata;
};

/**
 * Creates a new fleet alert with comprehensive validation and business logic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createFleetAlert = async (req, res) => {
  try {
    console.log('🚨 Executing fleet alert creation process...');

    // Execute input validation
    const validationErrors = validateFleetAlertInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeFleetAlertData(req.body);

    // Execute parallel validations
    const [isAlertIdUnique, referentialCheck] = await Promise.all([
      checkFleetAlertUniqueness(normalizedData.id),
      validateReferentialIntegrity(
        normalizedData.companyId, 
        normalizedData.vehicleId, 
        normalizedData.createdBy
      )
    ]);

    // Handle uniqueness validation failure
    if (!isAlertIdUnique) {
      return res.status(409).json({
        success: false,
        message: `Fleet alert with ID ${normalizedData.id} already exists`
      });
    }

    // Handle referential integrity validation failure
    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', ')
      });
    }

    // Generate alert metadata
    const alertMetadata = generateAlertMetadata(
      normalizedData.alertType, 
      normalizedData.alertMessage
    );

    // Prepare fleet alert document
    const fleetAlertData = {
      id: normalizedData.id,
      companyId: normalizedData.companyId,
      vehicleId: normalizedData.vehicleId || null,
      alertType: normalizedData.alertType || 'OTHER',
      alertMessage: normalizedData.alertMessage,
      alertDate: normalizedData.alertDate,
      resolvedAt: normalizedData.resolvedAt || null,
      createdBy: normalizedData.createdBy || null,
      metadata: alertMetadata,
      status: normalizedData.resolvedAt ? 'RESOLVED' : 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Fleet alert data validated, proceeding with creation...');

    // Persist fleet alert document
    const fleetAlert = new FleetAlert(fleetAlertData);
    const savedAlert = await fleetAlert.save();

    console.log(`✅ Fleet alert creation successful: ${savedAlert.alertType} alert (ID: ${savedAlert.id})`);

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'Fleet alert created successfully',
      data: savedAlert,
      metadata: {
        priority: alertMetadata.priority,
        category: alertMetadata.category,
        requiresAttention: alertMetadata.priority === 'HIGH'
      }
    });

  } catch (error) {
    console.error('❌ Fleet alert creation process failed:', error);
    
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
        message: `Fleet alert with this ${field} already exists`
      });
    }

    // Handle date parsing errors
    if (error.name === 'TypeError' && error.message.includes('Invalid time value')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use ISO format (e.g., 2024-01-15T10:30:00.000Z)'
      });
    }

    // Return generic server error response
    return res.status(500).json({
      success: false,
      message: 'Server error during fleet alert creation: ' + error.message
    });
  }
};

/**
 * Retrieves all fleet alerts with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllFleetAlerts = async (req, res) => {
  try {
    console.log('🔍 Executing fleet alert retrieval process...');

    // Execute optimized query with field projection
    const alerts = await FleetAlert.find()
      .select('id companyId vehicleId alertType alertMessage alertDate resolvedAt status metadata createdAt')
      .sort({ alertDate: -1 })
      .lean()
      .maxTimeMS(10000)
      .exec();

    console.log(`✅ Fleet alert retrieval successful: ${alerts.length} alerts processed`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: alerts.length,
      data: alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fleet alert retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during fleet alert retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves fleet alerts by company ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getFleetAlertsByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    // Validate company ID parameter
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a positive integer.'
      });
    }

    console.log(`🔍 Executing fleet alert retrieval for company ID: ${companyId}`);

    // Execute optimized query
    const alerts = await FleetAlert.find({ companyId: companyId })
      .select('id vehicleId alertType alertMessage alertDate resolvedAt status metadata')
      .sort({ alertDate: -1 })
      .lean()
      .exec();

    console.log(`✅ Company fleet alert retrieval successful: ${alerts.length} alerts found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: alerts.length,
      companyId: companyId,
      data: alerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Company fleet alert retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company fleet alert retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves active (unresolved) fleet alerts with status filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getActiveFleetAlerts = async (req, res) => {
  try {
    console.log('🔍 Executing active fleet alert retrieval process...');

    // Execute optimized query for active alerts only
    const activeAlerts = await FleetAlert.find({ 
      resolvedAt: null,
      status: 'ACTIVE'
    })
    .select('id companyId vehicleId alertType alertMessage alertDate metadata priority')
    .sort({ 
      'metadata.priority': -1, 
      alertDate: -1 
    })
    .lean()
    .exec();

    console.log(`✅ Active fleet alert retrieval successful: ${activeAlerts.length} active alerts found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: activeAlerts.length,
      data: activeAlerts,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Active fleet alert retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during active fleet alert retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

export {
  createFleetAlert,
  getAllFleetAlerts,
  getFleetAlertsByCompany,
  getActiveFleetAlerts
};