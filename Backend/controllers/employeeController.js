import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import CompanyUser from '../models/CompanyUser.js';

/**
 * Validates employee input data with comprehensive business rules
 * @param {Object} data - Employee data to validate
 * @returns {Array} Array of validation errors
 */
const validateEmployeeInput = (data) => {
  const { id, companyId, userId, fullName, employeeCode, status } = data;
  const errors = [];

  // Required fields validation
  if (!id) errors.push('Employee ID is required');
  if (!companyId) errors.push('Company ID is required');
  if (!fullName) errors.push('Full name is required');
  if (!employeeCode) errors.push('Employee code is required');

  // Data type validation
  if (id && isNaN(id)) errors.push('Employee ID must be a number');
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (userId && isNaN(userId)) errors.push('User ID must be a number');

  // String content validation
  if (fullName && fullName.trim().length === 0) {
    errors.push('Full name cannot be empty');
  }
  if (fullName && fullName.trim().length > 100) {
    errors.push('Full name must be less than 100 characters');
  }
  if (employeeCode && employeeCode.trim().length > 20) {
    errors.push('Employee code must be less than 20 characters');
  }

  // Status validation
  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
};

/**
 * Normalizes employee data for consistent storage
 * @param {Object} data - Raw employee data
 * @returns {Object} Normalized employee data
 */
const normalizeEmployeeData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.id) normalized.id = parseInt(normalized.id, 10);
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.userId) normalized.userId = parseInt(normalized.userId, 10);

  // String sanitization
  if (normalized.fullName) normalized.fullName = normalized.fullName.trim().replace(/\s+/g, ' ');
  if (normalized.employeeCode) normalized.employeeCode = normalized.employeeCode.trim();
  if (normalized.phone) normalized.phone = normalized.phone.trim().replace(/\D/g, '');
  if (normalized.jobTitle) normalized.jobTitle = normalized.jobTitle.trim();
  if (normalized.photoUrl) normalized.photoUrl = normalized.photoUrl.trim();

  // Status normalization
  if (normalized.status) {
    normalized.status = normalized.status.toUpperCase();
  }

  // Date handling
  if (normalized.createdAt) {
    const date = new Date(normalized.createdAt);
    normalized.createdAt = isNaN(date.getTime()) ? new Date() : date;
  }

  return normalized;
};

/**
 * Validates referential integrity for company and user
 * @param {number} companyId - Company ID to validate
 * @param {number} userId - User ID to validate (optional)
 * @returns {Promise<Object>} Validation results
 */
const validateReferentialIntegrity = async (companyId, userId = null) => {
  const [companyExists, userExists] = await Promise.all([
    Company.findOne({ id: companyId }).select('_id').lean().exec(),
    userId ? User.findOne({ id: userId }).select('_id').lean().exec() : Promise.resolve(true)
  ]);

  const errors = [];
  if (!companyExists) errors.push(`Company with ID ${companyId} does not exist`);
  if (userId && !userExists) errors.push(`User with ID ${userId} does not exist`);

  return { isValid: errors.length === 0, errors };
};

/**
 * Checks for employee uniqueness constraints
 * @param {number} employeeId - Employee ID to check
 * @param {string} employeeCode - Employee code to check (optional)
 * @param {number} excludeEmployeeId - Employee ID to exclude (for updates)
 * @returns {Promise<Object>} Uniqueness validation results
 */
const checkEmployeeUniqueness = async (employeeId, employeeCode = null, excludeEmployeeId = null) => {
  const queries = [];

  // Check ID uniqueness
  const idQuery = { id: employeeId };
  if (excludeEmployeeId) idQuery.id = { $ne: excludeEmployeeId };
  queries.push(Employee.findOne(idQuery).select('_id').lean().exec());

  // Check employee code uniqueness if provided
  if (employeeCode) {
    const codeQuery = { employeeCode: employeeCode.trim() };
    if (excludeEmployeeId) codeQuery.id = { $ne: excludeEmployeeId };
    queries.push(Employee.findOne(codeQuery).select('_id').lean().exec());
  }

  const [existingById, existingByCode] = await Promise.all(queries);

  const errors = [];
  if (existingById) errors.push(`Employee with ID ${employeeId} already exists`);
  if (existingByCode) errors.push(`Employee with code '${employeeCode}' already exists`);

  return { isValid: errors.length === 0, errors };
};

/**
 * Gets user email by numeric user ID
 * @param {number} userId - Numeric user ID
 * @returns {Promise<string|null>} User email or null
 */
const getUserEmailById = async (userId) => {
  if (!userId) return null;
  
  try {
    const user = await User.findOne({ id: userId }).select('email').lean().exec();
    return user ? user.email : null;
  } catch (error) {
    console.error(`Error fetching user email for ID ${userId}:`, error);
    return null;
  }
};

/**
 * Gets user emails in bulk for multiple numeric user IDs
 * @param {Array<number>} userIds - Array of numeric user IDs
 * @returns {Promise<Object>} Map of user IDs to emails
 */
const getUserEmailsBulk = async (userIds) => {
  if (!userIds || userIds.length === 0) return {};
  
  try {
    const users = await User.find({ id: { $in: userIds } }).select('id email').lean().exec();
    const emailMap = {};
    users.forEach(user => {
      emailMap[user.id] = user.email;
    });
    return emailMap;
  } catch (error) {
    console.error('Error fetching user emails in bulk:', error);
    return {};
  }
};

/**
 * Transforms employee data for response (includes email from user)
 * @param {Object} employee - Employee document
 * @param {Object} emailMap - Map of user IDs to emails
 * @returns {Object} Transformed employee data
 */
const transformEmployeeResponse = (employee, emailMap = {}) => {
  const userEmail = employee.userId ? (emailMap[employee.userId] || null) : null;
  
  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    phone: employee.phone,
    jobTitle: employee.jobTitle,
    status: employee.status,
    photoUrl: employee.photoUrl,
    email: userEmail,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
  };
};

/**
 * GET /api/employees/workers - Get worker employees by company
 * Specialized function for driver/worker operations
 */
export const getWorkerEmployees = async (req, res) => {
  try {
    const { companyId, role = "worker", search = "" } = req.query;

    if (!companyId) {
      return res.status(400).json({ 
        success: false,
        message: "companyId is required" 
      });
    }

    console.log('🔍 Fetching worker employees for company:', companyId);

    // Convert companyId to numeric for querying
    const numericCompanyId = parseInt(companyId);

    if (isNaN(numericCompanyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format"
      });
    }
console.log('🔢 Numeric company ID:', numericCompanyId);
    // Step 1: Find all company_user records with role = 'worker'
    const companyUserRecords = await CompanyUser.find({
      companyId: numericCompanyId,
       role,
    }).lean();

    console.log('👥 Found company user records:', companyUserRecords);
    const userIds = companyUserRecords.map((cu) => cu.userId);
    console.log('👥 Found company users with worker role:', userIds.length);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: "No worker users found for this company"
      });
    }

    // Step 2: Get user emails in bulk
    const emailMap = await getUserEmailsBulk(userIds);

    // Step 3: Find all employees linked to those users
    const query = {
      companyId: numericCompanyId,
      status: "ACTIVE",
      userId: { $in: userIds },
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Step 4: Fetch employees (no population needed)
    const employees = await Employee.find(query)
      .select("id employeeCode fullName jobTitle phone status photoUrl userId")
      .sort({ fullName: 1 })
      .lean()
      .exec();

    console.log('✅ Found active worker employees:', employees.length);

    // Transform response to include user email
    const transformedEmployees = employees.map(employee => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      phone: employee.phone,
      status: employee.status,
      photoUrl: employee.photoUrl,
      email: emailMap[employee.userId] || null,
      userId: employee.userId
    }));

    res.json({
      success: true,
      data: transformedEmployees,
      count: transformedEmployees.length,
      message: `Found ${transformedEmployees.length} active worker employees`
    });
  } catch (err) {
    console.error("❌ Error fetching worker employees:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching worker employees", 
      error: err.message 
    });
  }
};

/**
 * GET /api/employees - Get all employees with optimized query execution
 */
export const getEmployees = async (req, res) => {
  try {
    console.log('🔄 Executing real-time employee retrieval from MongoDB...');
    
    // Execute optimized query without population
    const employees = await Employee.find()
      .select('id companyId userId employeeCode fullName phone jobTitle status photoUrl createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(10000)
      .exec();
    
    console.log(`✅ Employee retrieval successful: ${employees.length} records processed`);
    
    // Get unique user IDs for email lookup
    const userIds = [...new Set(employees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    // Transform response
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/:id - Get specific employee by ID with optimized query
 */
export const getEmployeeById = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    // Validate employee ID parameter
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for ID: ${employeeId}`);
    
    // Execute optimized query without population
    const employee = await Employee.findOne({ id: employeeId })
      .select('-__v')
      .lean()
      .exec();
    
    // Handle employee not found scenario
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Get user email if userId exists
    const userEmail = await getUserEmailById(employee.userId);
    
    console.log(`✅ Employee retrieval successful: ${employee.fullName}`);
    
    return res.json({
      success: true,
      data: {
        ...transformEmployeeResponse(employee),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee retrieval failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/company/:companyId - Get employees by company ID with comprehensive validation
 */
export const getEmployeesByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    // Validate company ID parameter
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for company ID: ${companyId}`);
    
    // Execute optimized query without population
    const companyDrivers = await CompanyUser.find({ companyId, role: 'driver' })
      .select('userId role')
      .lean()
      .exec()

      const userIds = companyDrivers.map(cd => cd.userId);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        companyId,
        data: [],
        timestamp: new Date().toISOString()
      });
    }

    // Fetch corresponding employees
    const employees = await Employee.find({ userId: { $in: userIds } })
      .select('id employeeCode fullName phone jobTitle status photoUrl userId createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Company employee retrieval successful: ${employees.length} employees found`);
    
    // Get unique user IDs for email lookup
    
    const emailMap = await getUserEmailsBulk(userIds);
    
    // Transform response
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      companyId: companyId,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Company employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during company employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};
// export const getDriversByCompany = async (req, res) => {
//   try {
//     const companyId = parseInt(req.params.companyId, 10);

//     if (isNaN(companyId) || companyId <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid company ID. Must be a positive integer.',
//         timestamp: new Date().toISOString()
//       });
//     }

//     console.log(`🔍 Retrieving drivers for company ID: ${companyId}`);

//     // Find all company users with role 'driver'
//     const companyDrivers = await CompanyUser.find({ companyId, role: 'driver' })
//       .select('userId role')
//       .lean()
//       .exec();

//     const userIds = companyDrivers.map(cd => cd.userId);

//     if (userIds.length === 0) {
//       return res.json({
//         success: true,
//         count: 0,
//         companyId,
//         data: [],
//         timestamp: new Date().toISOString()
//       });
//     }

//     // Fetch corresponding employees
//     const employees = await Employee.find({ userId: { $in: userIds } })
//       .select('id employeeCode fullName phone jobTitle status photoUrl userId createdAt')
//       .sort({ createdAt: -1 })
//       .lean()
//       .exec();

//     const emailMap = await getUserEmailsBulk(userIds);

//     // Merge employee info with role
//     const transformedDrivers = employees.map(emp => {
//       const driverRole = companyDrivers.find(cd => cd.userId === emp.userId)?.role;
//       return transformDriverResponse(emp, emailMap, driverRole);
//     });

//     return res.json({
//       success: true,
//       count: transformedDrivers.length,
//       companyId,
//       data: transformedDrivers,
//       timestamp: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('❌ Driver retrieval failed:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Database error during driver retrieval: ' + error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// };

/**
 * GET /api/employees/company/:companyId/active - Get active employees for driver assignment with optimized query
 */
export const getActiveEmployeesByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    
    // Validate company ID parameter
    if (isNaN(companyId) || companyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing active employee retrieval for company ID: ${companyId}`);
    
    // Execute optimized query for active employees only without population
    const activeEmployees = await Employee.find({ 
      companyId: companyId,
      status: 'ACTIVE'
    })
    .select('id employeeCode fullName jobTitle phone photoUrl userId')
    .sort({ fullName: 1 })
    .lean()
    .exec();
    
    console.log(`✅ Active employee retrieval successful: ${activeEmployees.length} active employees found`);
    
    // Get unique user IDs for email lookup
    const userIds = [...new Set(activeEmployees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    // Transform response
    const transformedEmployees = activeEmployees.map(employee => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      phone: employee.phone,
      photoUrl: employee.photoUrl,
      email: emailMap[employee.userId] || null,
      userId: employee.userId
    }));

    return res.json({
      success: true,
      count: transformedEmployees.length,
      companyId: companyId,
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Active employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during active employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/employees/status/:status - Get employees by status with validation
 */
export const getEmployeesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    
    // Validate status parameter
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔍 Executing employee retrieval for status: ${status}`);
    
    // Execute optimized query without population
    const employees = await Employee.find({ status: status.toUpperCase() })
      .select('id companyId employeeCode fullName jobTitle photoUrl userId createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    
    console.log(`✅ Status-based employee retrieval successful: ${employees.length} employees found`);
    
    // Get unique user IDs for email lookup
    const userIds = [...new Set(employees.map(emp => emp.userId).filter(Boolean))];
    const emailMap = await getUserEmailsBulk(userIds);
    
    // Transform response
    const transformedEmployees = employees.map(employee => 
      transformEmployeeResponse(employee, emailMap)
    );

    return res.json({
      success: true,
      count: transformedEmployees.length,
      status: status.toUpperCase(),
      data: transformedEmployees,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status-based employee retrieval failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status-based employee retrieval: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// The createEmployee, updateEmployee, deleteEmployee, and updateEmployeeStatus functions 
// remain the same as in the previous consolidated version since they don't use population

/**
 * POST /api/employees - Creates a new employee with comprehensive validation
 */
export const createEmployee = async (req, res) => {
  try {
    console.log('👤 Executing employee creation process...');

    // Execute input validation
    const validationErrors = validateEmployeeInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Normalize input data
    const normalizedData = normalizeEmployeeData(req.body);

    // Execute parallel validations
    const [referentialCheck, uniquenessCheck] = await Promise.all([
      validateReferentialIntegrity(normalizedData.companyId, normalizedData.userId),
      checkEmployeeUniqueness(normalizedData.id, normalizedData.employeeCode)
    ]);

    // Handle validation failures
    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Prepare employee document with defaults
    const employeeData = {
      id: normalizedData.id,
      companyId: normalizedData.companyId,
      userId: normalizedData.userId || null,
      employeeCode: normalizedData.employeeCode,
      fullName: normalizedData.fullName,
      phone: normalizedData.phone || null,
      jobTitle: normalizedData.jobTitle || null,
      photoUrl: normalizedData.photoUrl || null,
      status: normalizedData.status || 'ACTIVE',
      createdAt: normalizedData.createdAt || new Date()
    };

    console.log('✅ Employee data validated, proceeding with creation...');

    // Persist employee document
    const employee = new Employee(employeeData);
    const savedEmployee = await employee.save();

    // Get user email for response
    const userEmail = await getUserEmailById(savedEmployee.userId);

    console.log(`✅ Employee creation successful: ${savedEmployee.fullName} (ID: ${savedEmployee.id})`);

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: {
        ...transformEmployeeResponse(savedEmployee.toObject()),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Employee creation process failed:', error);
    
    // Handle Mongoose-specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `Employee with this ${field} already exists`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during employee creation: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PUT /api/employees/:id - Updates existing employee with comprehensive validation
 */
export const updateEmployee = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    // Validate employee ID parameter
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✏️ Executing employee update process for ID: ${employeeId}`);

    // Normalize update data
    const updateData = normalizeEmployeeData(req.body);

    // Execute parallel validations
    const [existingEmployee, referentialCheck, uniquenessCheck] = await Promise.all([
      Employee.findOne({ id: employeeId }).exec(),
      updateData.companyId || updateData.userId ? 
        validateReferentialIntegrity(
          updateData.companyId || employeeId, 
          updateData.userId
        ) : 
        Promise.resolve({ isValid: true, errors: [] }),
      updateData.employeeCode ? 
        checkEmployeeUniqueness(employeeId, updateData.employeeCode, employeeId) : 
        Promise.resolve({ isValid: true, errors: [] })
    ]);

    // Verify employee exists
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Handle validation failures
    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    if (!uniquenessCheck.isValid) {
      return res.status(409).json({
        success: false,
        message: uniquenessCheck.errors.join(', '),
        timestamp: new Date().toISOString()
      });
    }

    // Execute update operation
    const employee = await Employee.findOneAndUpdate(
      { id: employeeId },
      updateData,
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    // Get user email for response
    const userEmail = await getUserEmailById(employee.userId);

    console.log(`✅ Employee update successful: ${employee.fullName}`);

    return res.json({
      success: true,
      message: 'Employee updated successfully',
      data: {
        ...transformEmployeeResponse(employee.toObject()),
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee update process failed for ID ${req.params.id}:`, error);
    
    // Handle Mongoose-specific errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error during update',
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Employee with this employee code already exists',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Update process failed: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * DELETE /api/employees/:id - Deletes employee by ID with proper validation
 */
export const deleteEmployee = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    
    // Validate employee ID parameter
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🗑️ Executing employee deletion process for ID: ${employeeId}`);

    // Execute deletion operation
    const employee = await Employee.findOneAndDelete({ id: employeeId });

    // Handle employee not found scenario
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Employee deletion successful: ${employee.fullName}`);

    return res.json({
      success: true,
      message: 'Employee deleted successfully',
      deletedEmployee: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        companyId: employee.companyId,
        status: employee.status,
        createdAt: employee.createdAt
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Employee deletion process failed for ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during employee deletion: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * PATCH /api/employees/:id/status - Updates employee status with validation
 */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    // Validate employee ID parameter
    if (isNaN(employeeId) || employeeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID. Must be a positive integer.',
        timestamp: new Date().toISOString()
      });
    }

    // Validate status parameter
    const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔄 Executing status update for employee ${employeeId} to: ${status}`);

    // Execute status update operation
    const employee = await Employee.findOneAndUpdate(
      { id: employeeId },
      { status: status.toUpperCase() },
      { new: true }
    );

    // Handle employee not found scenario
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: `Employee with ID ${employeeId} not found`,
        timestamp: new Date().toISOString()
      });
    }

    // Get user email for response
    const userEmail = await getUserEmailById(employee.userId);

    console.log(`✅ Status update successful: ${employee.fullName} -> ${employee.status}`);

    return res.json({
      success: true,
      message: `Employee status updated to ${employee.status}`,
      data: {
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        status: employee.status,
        email: userEmail
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Status update process failed for employee ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Database error during status update: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
};