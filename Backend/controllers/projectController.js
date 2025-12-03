import Project from '../models/Project.js';
import Company from '../models/Company.js';

/**
 * Validates project input data with comprehensive business rules
 * @param {Object} data - Project data to validate
 * @returns {Array} Array of validation errors
 */
const validateProjectInput = (data) => {
  const { name, companyId, code, status, budget, startDate, endDate } = data;
  const errors = [];

  // Required fields validation
  if (!name) errors.push('Project name is required');
  if (!companyId) errors.push('Company ID is required');

  // Data type validation
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (budget && isNaN(budget)) errors.push('Budget must be a number');

  // String content validation
  if (name && name.trim().length === 0) {
    errors.push('Project name cannot be empty');
  }
  if (name && name.trim().length > 100) {
    errors.push('Project name must be less than 100 characters');
  }
  if (code && code.trim().length > 20) {
    errors.push('Project code must be less than 20 characters');
  }

  // Date validation
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.push('Start date must be a valid date');
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.push('End date must be a valid date');
    }
  }

  // Business logic validation
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      errors.push('End date must be after start date');
    }
  }

  if (budget && budget < 0) {
    errors.push('Budget cannot be negative');
  }

  // Status validation
  const validStatuses = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
};

/**
 * Normalizes project data for consistent storage
 * @param {Object} data - Raw project data
 * @returns {Object} Normalized project data
 */
const normalizeProjectData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.budget) normalized.budget = parseFloat(normalized.budget);

  // String sanitization
  if (normalized.name) normalized.name = normalized.name.trim().replace(/\s+/g, ' ');
  if (normalized.code) normalized.code = normalized.code.trim().toUpperCase();
  if (normalized.description) normalized.description = normalized.description.trim();
  if (normalized.location) normalized.location = normalized.location.trim();

  // Date handling with validation
  if (normalized.startDate) {
    const startDate = new Date(normalized.startDate);
    normalized.startDate = isNaN(startDate.getTime()) ? null : startDate;
  }

  if (normalized.endDate) {
    const endDate = new Date(normalized.endDate);
    normalized.endDate = isNaN(endDate.getTime()) ? null : endDate;
  }

  // Default values
  if (!normalized.status) normalized.status = 'PLANNING';
  if (!normalized.budget) normalized.budget = 0;

  return normalized;
};

/**
 * Validates company existence
 * @param {number} companyId - Company ID to validate
 * @returns {Promise<boolean>} True if company exists
 */
const validateCompanyExistence = async (companyId) => {
  const company = await Company.findOne({ id: companyId })
    .select('_id')
    .lean()
    .exec();

  return !!company;
};

/**
 * Checks for project code uniqueness
 * @param {string} code - Project code to check
 * @param {number} excludeProjectId - Project ID to exclude (for updates)
 * @returns {Promise<boolean>} True if project code is unique
 */
const checkProjectCodeUniqueness = async (code, excludeProjectId = null) => {
  const query = { code: code.trim().toUpperCase() };
  if (excludeProjectId) query.id = { $ne: excludeProjectId };

  const existingProject = await Project.findOne(query)
    .select('_id')
    .lean()
    .exec();

  return !existingProject;
};

/**
 * Generates next available project ID
 * @returns {Promise<number>} Next project ID
 */
const generateNextProjectId = async () => {
  const lastProject = await Project.findOne()
    .select('id')
    .sort({ id: -1 })
    .lean()
    .exec();

  return lastProject ? lastProject.id + 1 : 1;
};

/**
 * Generates project metadata based on project parameters
 * @param {Object} projectData - Project data for metadata generation
 * @returns {Object} Project metadata
 */
const generateProjectMetadata = (projectData) => {
  const metadata = {
    progress: 0,
    health: 'HEALTHY',
    timelineStatus: 'ON_TRACK',
    financialStatus: 'WITHIN_BUDGET',
    risks: []
  };

  const currentDate = new Date();

  // Calculate progress based on timeline
  if (projectData.startDate && projectData.endDate) {
    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.endDate);
    const totalDuration = endDate - startDate;
    const elapsedDuration = currentDate - startDate;

    if (totalDuration > 0 && elapsedDuration > 0) {
      metadata.progress = Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100);
    }

    // Timeline status
    if (currentDate > endDate && metadata.progress < 100) {
      metadata.timelineStatus = 'DELAYED';
      metadata.health = 'AT_RISK';
      metadata.risks.push('Project timeline exceeded');
    } else if ((endDate - currentDate) / totalDuration < 0.2 && metadata.progress < 80) {
      metadata.timelineStatus = 'AT_RISK';
      metadata.health = 'NEEDS_ATTENTION';
      metadata.risks.push('Approaching deadline with low progress');
    }
  }

  // Status-based health
  if (projectData.status === 'ON_HOLD') {
    metadata.health = 'ON_HOLD';
  } else if (projectData.status === 'CANCELLED') {
    metadata.health = 'CANCELLED';
  }

  return metadata;
};

/**
 * Builds optimized filter for project queries
 * @param {Object} query - Request query parameters
 * @returns {Object} MongoDB filter object
 */
const buildProjectFilter = (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.companyId) filter.companyId = parseInt(query.companyId, 10);
  if (query.health) filter['metadata.health'] = query.health;

  // Date range filtering
  if (query.startDateFrom) {
    filter.startDate = { $gte: new Date(query.startDateFrom) };
  }
  if (query.startDateTo) {
    filter.startDate = { ...filter.startDate, $lte: new Date(query.startDateTo) };
  }

  return filter;
};

/**
 * Retrieves all projects with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    console.log('🔍 Executing project retrieval process...');

    // Build optimized filter
    const filter = buildProjectFilter(req.query);

    // Execute parallel queries for data and count
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select('id name code companyId status budget startDate endDate metadata createdAt')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .maxTimeMS(10000)
        .exec(),
      Project.countDocuments(filter)
    ]);

    console.log(`✅ Project retrieval successful: ${projects.length} projects processed`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Project retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during project retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves projects by company ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProjectsByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    // Validate company ID parameter
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format. Must be a positive integer.'
      });
    }

    const { page = 1, limit = 10, status } = req.query;

    console.log(`🔍 Executing project retrieval for company ID: ${companyId}`);

    // Execute parallel validations and queries
    const [companyExists, projects, total] = await Promise.all([
      Company.findOne({ id: companyId }).select('name tenantCode').lean().exec(),
      Project.find({ 
        companyId,
        ...(status && { status })
      })
        .select('id name code status budget startDate endDate metadata createdAt')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      Project.countDocuments({ 
        companyId,
        ...(status && { status })
      })
    ]);

    // Handle company not found scenario
    if (!companyExists) {
      return res.status(404).json({
        success: false,
        message: `Company with ID ${companyId} not found`
      });
    }

    console.log(`✅ Company project retrieval successful: ${projects.length} projects found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: projects,
      company: {
        id: companyId,
        name: companyExists.name,
        tenantCode: companyExists.tenantCode
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Company project retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company project retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves specific project by ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProjectById = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    
    // Validate project ID parameter
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format. Must be a positive integer.'
      });
    }

    console.log(`🔍 Executing project retrieval for ID: ${projectId}`);

    // Execute optimized query
    const project = await Project.findOne({ id: projectId })
      .select('-__v')
      .lean()
      .exec();
    
    // Handle project not found scenario
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }

    console.log(`✅ Project retrieval successful: ${project.name}`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: project
    });

  } catch (error) {
    console.error(`❌ Project retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during project retrieval: ' + error.message
    });
  }
};

/**
 * Creates a new project with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createProject = async (req, res) => {
  try {
    console.log('🏗️  Executing project creation process...');

    // Execute input validation
    const validationErrors = validateProjectInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeProjectData(req.body);

    // Execute parallel validations
    const [nextProjectId, companyExists, isCodeUnique] = await Promise.all([
      generateNextProjectId(),
      validateCompanyExistence(normalizedData.companyId),
      normalizedData.code ? checkProjectCodeUniqueness(normalizedData.code) : Promise.resolve(true)
    ]);

    // Handle company existence validation failure
    if (!companyExists) {
      return res.status(400).json({
        success: false,
        message: `Company with ID ${normalizedData.companyId} does not exist`
      });
    }

    // Handle code uniqueness validation failure
    if (!isCodeUnique) {
      return res.status(409).json({
        success: false,
        message: `Project code '${normalizedData.code}' already exists`
      });
    }

    // Generate project metadata
    const projectMetadata = generateProjectMetadata(normalizedData);

    // Prepare project document
    const projectData = {
      id: nextProjectId,
      ...normalizedData,
      metadata: projectMetadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Project data validated, proceeding with creation...');

    // Persist project document
    const project = new Project(projectData);
    const savedProject = await project.save();

    console.log(`✅ Project creation successful: ${savedProject.name} (ID: ${savedProject.id})`);

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: savedProject,
      metadata: {
        progress: projectMetadata.progress,
        health: projectMetadata.health,
        timelineStatus: projectMetadata.timelineStatus
      }
    });

  } catch (error) {
    console.error('❌ Project creation process failed:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Project with this ${field} already exists`
      });
    }

    // Return generic server error response
    return res.status(500).json({
      success: false,
      message: 'Server error during project creation: ' + error.message
    });
  }
};

/**
 * Updates existing project with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    
    // Validate project ID parameter
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format. Must be a positive integer.'
      });
    }

    console.log(`✏️ Executing project update process for ID: ${projectId}`);

    // Normalize update data
    const updateData = normalizeProjectData(req.body);
    
    // Remove protected fields
    delete updateData.id;
    delete updateData._id;
    
    updateData.updatedAt = new Date();

    // Execute parallel validations
    const [existingProject, companyExists, isCodeUnique] = await Promise.all([
      Project.findOne({ id: projectId }).exec(),
      updateData.companyId ? validateCompanyExistence(updateData.companyId) : Promise.resolve(true),
      updateData.code ? checkProjectCodeUniqueness(updateData.code, projectId) : Promise.resolve(true)
    ]);

    // Verify project exists
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }

    // Handle company existence validation failure
    if (updateData.companyId && !companyExists) {
      return res.status(400).json({
        success: false,
        message: `Company with ID ${updateData.companyId} does not exist`
      });
    }

    // Handle code uniqueness validation failure
    if (!isCodeUnique) {
      return res.status(409).json({
        success: false,
        message: `Project code '${updateData.code}' already exists`
      });
    }

    // Generate updated metadata if relevant fields changed
    const metadataFields = ['startDate', 'endDate', 'status', 'budget'];
    const shouldUpdateMetadata = metadataFields.some(field => updateData[field] !== undefined);
    
    if (shouldUpdateMetadata) {
      const mergedData = { ...existingProject.toObject(), ...updateData };
      updateData.metadata = { ...existingProject.metadata, ...generateProjectMetadata(mergedData) };
    }

    // Execute update operation
    const project = await Project.findOneAndUpdate(
      { id: projectId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    console.log(`✅ Project update successful: ${project.name}`);

    // Return successful update response
    return res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });

  } catch (error) {
    console.error(`❌ Project update process failed for ID ${req.params.id}:`, error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Project with this ${field} already exists`
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Update process failed: ' + error.message
    });
  }
};

/**
 * Deletes project by ID with proper validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteProject = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    
    // Validate project ID parameter
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format. Must be a positive integer.'
      });
    }

    console.log(`🗑️ Executing project deletion process for ID: ${projectId}`);

    // Execute deletion operation
    const project = await Project.findOneAndDelete({ id: projectId });

    // Handle project not found scenario
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project with ID ${projectId} not found`
      });
    }

    console.log(`✅ Project deletion successful: ${project.name}`);

    // Return successful deletion response
    return res.json({
      success: true,
      message: 'Project deleted successfully',
      data: { 
        id: projectId,
        name: project.name,
        code: project.code
      }
    });

  } catch (error) {
    console.error(`❌ Project deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during project deletion: ' + error.message
    });
  }
};

/**
 * Retrieves project statistics with comprehensive aggregation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getProjectStats = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    // Validate company ID parameter
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format. Must be a positive integer.'
      });
    }

    console.log(`📊 Executing project statistics retrieval for company ID: ${companyId}`);

    // Execute parallel aggregation queries
    const [statusStats, healthStats, budgetStats, timelineStats] = await Promise.all([
      // Status-based statistics
      Project.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' },
            avgProgress: { $avg: '$metadata.progress' }
          }
        }
      ]),
      // Health-based statistics
      Project.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: '$metadata.health',
            count: { $sum: 1 },
            totalBudget: { $sum: '$budget' }
          }
        }
      ]),
      // Budget statistics
      Project.aggregate([
        { $match: { companyId } },
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$budget' },
            avgBudget: { $avg: '$budget' },
            minBudget: { $min: '$budget' },
            maxBudget: { $max: '$budget' },
            projectCount: { $sum: 1 }
          }
        }
      ]),
      // Timeline statistics
      Project.aggregate([
        { $match: { companyId, startDate: { $ne: null }, endDate: { $ne: null } } },
        {
          $group: {
            _id: null,
            upcomingCount: {
              $sum: {
                $cond: [{ $gt: ['$startDate', new Date()] }, 1, 0]
              }
            },
            activeCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lte: ['$startDate', new Date()] },
                      { $gte: ['$endDate', new Date()] }
                    ]
                  }, 1, 0
                ]
              }
            },
            overdueCount: {
              $sum: {
                $cond: [{ $lt: ['$endDate', new Date()] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    console.log(`✅ Project statistics retrieval successful for company ${companyId}`);

    // Return successful statistics response
    return res.json({
      success: true,
      data: {
        statusStats,
        healthStats,
        budgetSummary: budgetStats[0] || {},
        timelineSummary: timelineStats[0] || {},
        companyId
      }
    });

  } catch (error) {
    console.error('❌ Project statistics retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during project statistics retrieval: ' + error.message
    });
  }
};

export {
  getAllProjects,
  getProjectsByCompany,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};