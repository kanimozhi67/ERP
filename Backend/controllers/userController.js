import User from '../models/User.js';

/**
 * Validates user input data with comprehensive business rules
 * @param {Object} data - User data to validate
 * @returns {Array} Array of validation errors
 */
const validateUserInput = (data) => {
  const { id, email, name, isActive } = data;
  const errors = [];

  // Required fields validation
  if (!id) errors.push('User ID is required');
  if (!email) errors.push('Email is required');
  if (!name) errors.push('Name is required');

  // Data type validation
  if (id && isNaN(id)) errors.push('User ID must be a number');

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Name validation
  if (name && name.trim().length === 0) {
    errors.push('User name cannot be empty');
  }
  if (name && name.trim().length > 100) {
    errors.push('User name must be less than 100 characters');
  }

  // Email length validation
  if (email && email.length > 254) {
    errors.push('Email address is too long');
  }

  // Active status validation
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('Active status must be a boolean value');
  }

  return errors;
};

/**
 * Normalizes user data for consistent storage
 * @param {Object} data - Raw user data
 * @returns {Object} Normalized user data
 */
const normalizeUserData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.id) normalized.id = parseInt(normalized.id, 10);

  // String sanitization
  if (normalized.email) normalized.email = normalized.email.toLowerCase().trim();
  if (normalized.name) normalized.name = normalized.name.trim().replace(/\s+/g, ' ');

  // Boolean conversion
  if (normalized.isActive !== undefined) {
    normalized.isActive = Boolean(normalized.isActive);
  }

  // Date handling with validation
  if (normalized.createdAt) {
    const createDate = new Date(normalized.createdAt);
    normalized.createdAt = isNaN(createDate.getTime()) ? new Date() : createDate;
  } else {
    normalized.createdAt = new Date();
  }

  // Default values
  if (normalized.isActive === undefined) normalized.isActive = true;

  return normalized;
};

/**
 * Checks for user uniqueness constraints
 * @param {number} userId - User ID to check
 * @param {string} email - Email to check
 * @param {number} excludeUserId - User ID to exclude (for updates)
 * @returns {Promise<Object>} Uniqueness validation results
 */
const checkUserUniqueness = async (userId, email, excludeUserId = null) => {
  const queries = [];

  // Check ID uniqueness
  const idQuery = { id: userId };
  if (excludeUserId) idQuery.id = { $ne: excludeUserId };
  queries.push(User.findOne(idQuery).select('_id').lean().exec());

  // Check email uniqueness
  const emailQuery = { email: email.toLowerCase().trim() };
  if (excludeUserId) emailQuery.id = { $ne: excludeUserId };
  queries.push(User.findOne(emailQuery).select('_id').lean().exec());

  const [existingById, existingByEmail] = await Promise.all(queries);

  const errors = [];
  if (existingById) errors.push(`User with ID ${userId} already exists`);
  if (existingByEmail) errors.push(`User with email ${email} already exists`);

  return { isValid: errors.length === 0, errors };
};

/**
 * Generates user metadata based on user parameters
 * @param {Object} userData - User data for metadata generation
 * @returns {Object} User metadata
 */
const generateUserMetadata = (userData) => {
  const metadata = {
    accountStatus: 'ACTIVE',
    lastActive: null,
    loginCount: 0,
    preferences: {},
    security: {
      emailVerified: false,
      twoFactorEnabled: false
    }
  };

  // Account status based on active flag
  if (!userData.isActive) {
    metadata.accountStatus = 'INACTIVE';
  }

  // Set last active timestamp for new active users
  if (userData.isActive) {
    metadata.lastActive = new Date();
  }

  return metadata;
};

/**
 * Creates a new user with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createUser = async (req, res) => {
  try {
    console.log('👤 Executing user creation process...');

    // Execute input validation
    const validationErrors = validateUserInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeUserData(req.body);

    // Execute uniqueness validation
    const uniquenessCheck = await checkUserUniqueness(
      normalizedData.id, 
      normalizedData.email
    );

    // Handle uniqueness validation failure
    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', ')
      });
    }

    // Generate user metadata
    const userMetadata = generateUserMetadata(normalizedData);

    // Prepare user document
    const userData = {
      ...normalizedData,
      metadata: userMetadata,
      updatedAt: new Date()
    };

    console.log('✅ User data validated, proceeding with creation...');

    // Persist user document
    const user = new User(userData);
    const savedUser = await user.save();

    console.log(`✅ User creation successful: ${savedUser.name} (ID: ${savedUser.id})`);

    // Return successful creation response
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: savedUser,
      metadata: {
        accountStatus: userMetadata.accountStatus,
        security: userMetadata.security
      }
    });

  } catch (error) {
    console.error('❌ User creation process failed:', error);
    
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
        message: `User with this ${field} already exists`
      });
    }

    // Return generic server error response
    return res.status(500).json({
      success: false,
      message: 'Server error during user creation: ' + error.message
    });
  }
};

/**
 * Retrieves all users with optimized query execution
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isActive 
    } = req.query;

    console.log('🔍 Executing user retrieval process...');

    // Build optimized filter
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Execute parallel queries for data and count
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('id email name isActive metadata.createdAt')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .maxTimeMS(10000)
        .exec(),
      User.countDocuments(filter)
    ]);

    console.log(`✅ User retrieval successful: ${users.length} users processed`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: users.length,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ User retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during user retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Retrieves specific user by ID with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Validate user ID parameter
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.'
      });
    }

    console.log(`🔍 Executing user retrieval for ID: ${userId}`);

    // Execute optimized query
    const user = await User.findOne({ id: userId })
      .select('-__v')
      .lean()
      .exec();
    
    // Handle user not found scenario
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`
      });
    }

    console.log(`✅ User retrieval successful: ${user.name}`);

    // Return successful retrieval response
    return res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error(`❌ User retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during user retrieval: ' + error.message
    });
  }
};

/**
 * Retrieves users by status with validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUsersByStatus = async (req, res) => {
  try {
    const { isActive } = req.params;
    
    // Validate status parameter
    if (isActive !== 'true' && isActive !== 'false') {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "true" or "false"'
      });
    }

    const activeStatus = isActive === 'true';

    console.log(`🔍 Executing user retrieval for status: ${activeStatus ? 'ACTIVE' : 'INACTIVE'}`);

    // Execute optimized query
    const users = await User.find({ isActive: activeStatus })
      .select('id email name createdAt metadata.lastActive')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Status-based user retrieval successful: ${users.length} users found`);

    // Return successful retrieval response
    return res.json({
      success: true,
      count: users.length,
      status: activeStatus ? 'ACTIVE' : 'INACTIVE',
      data: users
    });

  } catch (error) {
    console.error('❌ Status-based user retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status-based user retrieval: ' + error.message
    });
  }
};

/**
 * Updates existing user with comprehensive validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Validate user ID parameter
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.'
      });
    }

    console.log(`✏️ Executing user update process for ID: ${userId}`);

    // Normalize update data
    const updateData = normalizeUserData(req.body);
    updateData.updatedAt = new Date();

    // Execute parallel validations
    const [existingUser, uniquenessCheck] = await Promise.all([
      User.findOne({ id: userId }).exec(),
      updateData.email ? 
        checkUserUniqueness(userId, updateData.email, userId) : 
        Promise.resolve({ isValid: true, errors: [] })
    ]);

    // Verify user exists
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`
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
    const metadataFields = ['isActive'];
    const shouldUpdateMetadata = metadataFields.some(field => updateData[field] !== undefined);
    
    if (shouldUpdateMetadata) {
      const mergedData = { ...existingUser.toObject(), ...updateData };
      updateData.metadata = { 
        ...existingUser.metadata, 
        ...generateUserMetadata(mergedData) 
      };

      // Update last active timestamp if user is being activated
      if (updateData.isActive && !existingUser.isActive) {
        updateData.metadata.lastActive = new Date();
      }
    }

    // Execute update operation
    const user = await User.findOneAndUpdate(
      { id: userId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    console.log(`✅ User update successful: ${user.name}`);

    // Return successful update response
    return res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });

  } catch (error) {
    console.error(`❌ User update process failed for ID ${req.params.id}:`, error);
    
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
 * Deletes user by ID with proper validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Validate user ID parameter
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID. Must be a positive integer.'
      });
    }

    console.log(`🗑️ Executing user deletion process for ID: ${userId}`);

    // Execute deletion operation
    const user = await User.findOneAndDelete({ id: userId });

    // Handle user not found scenario
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${userId} not found`
      });
    }

    console.log(`✅ User deletion successful: ${user.name}`);

    // Return successful deletion response
    return res.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(`❌ User deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during user deletion: ' + error.message
    });
  }
};

/**
 * Retrieves user statistics with comprehensive aggregation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getUserStats = async (req, res) => {
  try {
    console.log('📊 Executing user statistics retrieval...');

    // Execute parallel aggregation queries
    const [statusStats, activityStats, timelineStats] = await Promise.all([
      // Status-based statistics
      User.aggregate([
        {
          $group: {
            _id: '$isActive',
            count: { $sum: 1 },
            latestUser: { $max: '$createdAt' }
          }
        }
      ]),
      // Activity-based statistics (if metadata exists)
      User.aggregate([
        {
          $group: {
            _id: '$metadata.accountStatus',
            count: { $sum: 1 }
          }
        }
      ]),
      // Timeline statistics (users created by time periods)
      User.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 12 }
      ])
    ]);

    console.log(`✅ User statistics retrieval successful`);

    // Transform status stats for better readability
    const transformedStatusStats = statusStats.map(stat => ({
      status: stat._id ? 'ACTIVE' : 'INACTIVE',
      count: stat.count,
      latestUser: stat.latestUser
    }));

    // Return successful statistics response
    return res.json({
      success: true,
      data: {
        statusStats: transformedStatusStats,
        activityStats,
        timelineStats,
        totalUsers: statusStats.reduce((sum, stat) => sum + stat.count, 0)
      }
    });

  } catch (error) {
    console.error('❌ User statistics retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during user statistics retrieval: ' + error.message
    });
  }
};
export {
  createUser,
  getUsers,
  getUserById,
  getUsersByStatus,
  updateUser,
  deleteUser,
  getUserStats
};