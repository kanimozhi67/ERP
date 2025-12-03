import Company from '../models/Company.js';

/**
 * Validates company input data with comprehensive checks
 * @param {Object} data - Company data to validate
 * @returns {Array} Array of validation errors
 */
const validateCompanyInput = (data) => {
  const { name, tenantCode } = data;
  const errors = [];

  // Required fields validation
  if (!name || !tenantCode) {
    errors.push('Name and tenantCode are required fields');
  }

  // String content validation
  if (name && name.trim().length === 0) {
    errors.push('Company name cannot be empty');
  }

  if (tenantCode && tenantCode.trim().length === 0) {
    errors.push('Tenant code cannot be empty');
  }

  // Length validation for security
  if (name && name.trim().length > 100) {
    errors.push('Company name must be less than 100 characters');
  }

  if (tenantCode && tenantCode.trim().length > 20) {
    errors.push('Tenant code must be less than 20 characters');
  }

  return errors;
};

/**
 * Normalizes and sanitizes company data for consistent storage
 * @param {Object} data - Raw company data
 * @returns {Object} Normalized company data
 */
const normalizeCompanyData = (data) => {
  const normalized = { ...data };

  if (normalized.name) {
    normalized.name = normalized.name.trim().replace(/\s+/g, ' ');
  }

  if (normalized.tenantCode) {
    normalized.tenantCode = normalized.tenantCode.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
  }

  if (normalized.contactEmail) {
    normalized.contactEmail = normalized.contactEmail.toLowerCase().trim();
  }

  if (normalized.address) {
    normalized.address = normalized.address.trim();
  }

  if (normalized.contactPhone) {
    normalized.contactPhone = normalized.contactPhone.trim();
  }

  return normalized;
};

/**
 * Handles Mongoose-specific errors and returns appropriate responses
 * @param {Error} error - Mongoose error object
 * @returns {Object|null} Formatted error response or null
 */
const handleMongooseError = (error) => {
  // Validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return {
      status: 400,
      response: {
        success: false,
        message: 'Validation error',
        errors
      }
    };
  }

  // Duplicate key errors
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return {
      status: 400,
      response: {
        success: false,
        message: `Company with this ${field} already exists`
      }
    };
  }

  // Cast errors (invalid ObjectId, etc.)
  if (error.name === 'CastError') {
    return {
      status: 400,
      response: {
        success: false,
        message: `Invalid ${error.path}: ${error.value}`
      }
    };
  }

  return null;
};

/**
 * Creates a new company with comprehensive validation and error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createCompany = async (req, res) => {
  try {
    const { name, tenantCode, address, contactEmail, contactPhone } = req.body;

    console.log('Received company data:', req.body);

    // Validate required fields
    if (!name || !tenantCode) {
      return res.status(400).json({
        success: false,
        message: 'Company name and tenant code are required'
      });
    }

    // Execute input validation
    const validationErrors = validateCompanyInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize and sanitize input data
    const normalizedData = normalizeCompanyData({
      name,
      tenantCode,
      address,
      contactEmail,
      contactPhone
    });

    // Check if tenant code already exists
    const existingCompany = await Company.findOne({ tenantCode: normalizedData.tenantCode });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Tenant code already exists'
      });
    }

    // Generate numeric ID
    const lastCompany = await Company.findOne().sort({ id: -1 });
    const newId = lastCompany ? lastCompany.id + 1 : 1;

    const company = new Company({
      id: newId,
      name: normalizedData.name,
      tenantCode: normalizedData.tenantCode,
      address: normalizedData.address,
      contactEmail: normalizedData.contactEmail,
      contactPhone: normalizedData.contactPhone
    });

    const savedCompany = await company.save();
    console.log('Company saved successfully:', savedCompany);
    
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: savedCompany
    });
  } catch (error) {
    // Handle known Mongoose errors
    const mongooseError = handleMongooseError(error);
    if (mongooseError) {
      return res.status(mongooseError.status).json(mongooseError.response);
    }

    console.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company',
      error: error.message
    });
  }
};

/**
 * Retrieves all companies with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: companies,
      count: companies.length
    });
  } catch (error) {
    console.error('Companies retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

/**
 * Retrieves specific company by ID with robust error handling
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    // Handle known Mongoose errors
    const mongooseError = handleMongooseError(error);
    if (mongooseError) {
      return res.status(mongooseError.status).json(mongooseError.response);
    }

    console.error(`Company retrieval error for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company',
      error: error.message
    });
  }
};

/**
 * Retrieves company by tenant code with input sanitization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getCompanyByTenantCode = async (req, res) => {
  try {
    const { tenantCode } = req.params;

    // Sanitize and normalize tenant code
    const normalizedTenantCode = tenantCode.toUpperCase().trim().replace(/[^A-Z0-9_-]/g, '');
    
    const company = await Company.findOne({ tenantCode: normalizedTenantCode });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: `Company with tenant code '${tenantCode}' not found`
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    console.error(`Company retrieval error for tenant code ${req.params.tenantCode}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company',
      error: error.message
    });
  }
};

/**
 * Updates existing company with comprehensive validation and conflict checking
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateCompany = async (req, res) => {
  try {
    const { name, tenantCode, address, contactEmail, contactPhone } = req.body;

    // Normalize and validate update data
    const updateData = normalizeCompanyData({
      name,
      tenantCode,
      address,
      contactEmail,
      contactPhone,
      updatedAt: Date.now()
    });

    // Validate business rules
    if (updateData.name && updateData.name.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Company name cannot be empty'
      });
    }

    if (updateData.tenantCode && updateData.tenantCode.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tenant code cannot be empty'
      });
    }

    // Check for tenant code conflicts if tenantCode is being updated
    if (updateData.tenantCode) {
      const existingCompanyWithTenantCode = await Company.findOne({
        tenantCode: updateData.tenantCode,
        _id: { $ne: req.params.id }
      });

      if (existingCompanyWithTenantCode) {
        return res.status(400).json({
          success: false,
          message: 'Tenant code already exists'
        });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany
    });
  } catch (error) {
    // Handle known Mongoose errors
    const mongooseError = handleMongooseError(error);
    if (mongooseError) {
      return res.status(mongooseError.status).json(mongooseError.response);
    }

    console.error(`Company update error for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error updating company',
      error: error.message
    });
  }
};

/**
 * Deletes company by ID with proper cleanup and response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteCompany = async (req, res) => {
  try {
    const deletedCompany = await Company.findByIdAndDelete(req.params.id);
    
    if (!deletedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company deleted successfully',
      data: deletedCompany
    });
  } catch (error) {
    // Handle known Mongoose errors
    const mongooseError = handleMongooseError(error);
    if (mongooseError) {
      return res.status(mongooseError.status).json(mongooseError.response);
    }

    console.error(`Company deletion error for ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company',
      error: error.message
    });
  }
};

// ES6 Export
export {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyByTenantCode,
  updateCompany,
  deleteCompany
};