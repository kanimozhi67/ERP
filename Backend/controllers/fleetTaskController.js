import FleetTask from '../models/FleetTask.js';
import Company from '../models/Company.js';
import FleetVehicle from '../models/FleetVehicle.js';
import Employee from '../models/Employee.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { sendEmailNotification } from '../utils/emailService.js';

/**
 * Validates fleet task input data with comprehensive business rules
 */
const validateFleetTaskInput = (data) => {
  const { 
    id, companyId, vehicleId, taskDate, plannedPickupTime, plannedDropTime, 
    expectedPassengers, actualStartTime, actualEndTime, status 
  } = data;
  const errors = [];

  // Required fields validation
  if (!companyId) errors.push('Company ID is required');
  if (!vehicleId) errors.push('Vehicle ID is required');
  if (!taskDate) errors.push('Task date is required');

  // Data type validation
  if (companyId && isNaN(companyId)) errors.push('Company ID must be a number');
  if (vehicleId && isNaN(vehicleId)) errors.push('Vehicle ID must be a number');
  if (expectedPassengers && isNaN(expectedPassengers)) errors.push('Expected passengers must be a number');

  // Date validation
  const dateFields = [
    { field: 'taskDate', value: taskDate, name: 'Task date' },
    { field: 'plannedPickupTime', value: plannedPickupTime, name: 'Planned pickup time' },
    { field: 'plannedDropTime', value: plannedDropTime, name: 'Planned drop time' },
    { field: 'actualStartTime', value: actualStartTime, name: 'Actual start time' },
    { field: 'actualEndTime', value: actualEndTime, name: 'Actual end time' }
  ];

  dateFields.forEach(({ field, value, name }) => {
    if (value) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push(`${name} must be a valid date`);
      }
    }
  });

  // Business logic validation
  if (plannedPickupTime && plannedDropTime) {
    const pickupTime = new Date(plannedPickupTime);
    const dropTime = new Date(plannedDropTime);
    if (dropTime <= pickupTime) {
      errors.push('Planned drop time must be after planned pickup time');
    }
  }

  if (actualStartTime && actualEndTime) {
    const startTime = new Date(actualStartTime);
    const endTime = new Date(actualEndTime);
    if (endTime <= startTime) {
      errors.push('Actual end time must be after actual start time');
    }
  }

  // Status validation
  const validStatuses = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  // Expected passengers validation
  if (expectedPassengers && (expectedPassengers < 0 || expectedPassengers > 100)) {
    errors.push('Expected passengers must be between 0 and 100');
  }

  return errors;
};

/**
 * ✅ FIXED: Format time for display (12-hour format with seconds) - preserves 12:00 AM exactly
 */
const formatTimeForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // If it's already a string (like "12:00 AM"), return as is
    if (typeof dateString === 'string' && dateString.includes(':')) {
      return dateString;
    }
    
    // If it's a Date object, format to 12-hour time string
    const date = new Date(dateString);
    
    // Get hours, minutes, seconds
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    
    // ✅ FIXED: Convert to 12-hour format correctly
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours; // 0 becomes 12 for AM
    
    // Format with leading zeros
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  } catch (error) {
    console.error('Time formatting error:', error);
    return 'N/A';
  }
};

/**
 * Normalizes fleet task data for consistent storage - FIXED TIMEZONE ISSUE
 */
const normalizeFleetTaskData = (data) => {
  const normalized = { ...data };

  // Type conversion
  if (normalized.companyId) normalized.companyId = parseInt(normalized.companyId, 10);
  if (normalized.projectId) normalized.projectId = parseInt(normalized.projectId, 10);
  if (normalized.driverId) normalized.driverId = parseInt(normalized.driverId, 10);
  if (normalized.vehicleId) normalized.vehicleId = parseInt(normalized.vehicleId, 10);
  if (normalized.createdBy) normalized.createdBy = parseInt(normalized.createdBy, 10);
  if (normalized.expectedPassengers) normalized.expectedPassengers = parseInt(normalized.expectedPassengers, 10);

  // String sanitization
  if (normalized.pickupAddress) normalized.pickupAddress = normalized.pickupAddress.trim();
  if (normalized.dropAddress) normalized.dropAddress = normalized.dropAddress.trim();
  if (normalized.notes) normalized.notes = normalized.notes.trim();
  if (normalized.pickupLocation) normalized.pickupLocation = normalized.pickupLocation.trim();
  if (normalized.dropLocation) normalized.dropLocation = normalized.dropLocation.trim();

  // FIXED: Simple date handling without timezone manipulation
  const parseDateSimple = (dateString) => {
    if (!dateString) return null;
    
    // If it's already a Date object, return as is
    if (dateString instanceof Date) return dateString;
    
    // For string dates, create date object directly
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return null;
    }
    return date;
  };

  // Apply simple date parsing without timezone shifts
  if (normalized.taskDate) {
    const date = new Date(normalized.taskDate);
    normalized.taskDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }
  
  // Use simple parsing without timezone manipulation
  if (normalized.plannedPickupTime) normalized.plannedPickupTime = parseDateSimple(normalized.plannedPickupTime);
  if (normalized.plannedDropTime) normalized.plannedDropTime = parseDateSimple(normalized.plannedDropTime);
  if (normalized.actualStartTime) normalized.actualStartTime = parseDateSimple(normalized.actualStartTime);
  if (normalized.actualEndTime) normalized.actualEndTime = parseDateSimple(normalized.actualEndTime);

  // Default values
  if (!normalized.status) normalized.status = 'PLANNED';
  if (!normalized.expectedPassengers) normalized.expectedPassengers = 0;
  if (!normalized.createdAt) normalized.createdAt = new Date();

  return normalized;
};

/**
 * Validates referential integrity for related entities
 */
const validateReferentialIntegrity = async (companyId, vehicleId, driverId = null, projectId = null) => {
  const validationPromises = [
    Company.findOne({ id: companyId }).select('_id name').lean().exec(),
    FleetVehicle.findOne({ id: vehicleId }).select('_id vehicleCode registrationNo').lean().exec(),
    driverId ? Employee.findOne({ id: driverId }).select('_id fullName').lean().exec() : Promise.resolve(true),
    projectId ? Project.findOne({ id: projectId }).select('_id name').lean().exec() : Promise.resolve(true)
  ];

  const [company, vehicle, driver, project] = await Promise.all(validationPromises);

  const errors = [];
  if (!company) errors.push(`Company with ID ${companyId} does not exist`);
  if (!vehicle) errors.push(`Fleet vehicle with ID ${vehicleId} does not exist`);
  if (driverId && !driver) errors.push(`Driver with ID ${driverId} does not exist`);
  if (projectId && !project) errors.push(`Project with ID ${projectId} does not exist`);

  return { 
    isValid: errors.length === 0, 
    errors,
    company,
    vehicle,
    driver,
    project
  };
};

/**
 * Generates task metadata based on task parameters
 */
const generateTaskMetadata = (taskData) => {
  const metadata = {
    priority: 'MEDIUM',
    estimatedDuration: null,
    requiresSpecialAttention: false,
    passengerCount: taskData.expectedPassengers || 0
  };

  // Calculate estimated duration if both pickup and drop times are provided
  if (taskData.plannedPickupTime && taskData.plannedDropTime) {
    const pickupTime = new Date(taskData.plannedPickupTime);
    const dropTime = new Date(taskData.plannedDropTime);
    const durationMs = dropTime - pickupTime;
    metadata.estimatedDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
  }

  // Set priority based on passenger count and other factors
  if (metadata.passengerCount > 10) {
    metadata.priority = 'HIGH';
    metadata.requiresSpecialAttention = true;
  } else if (metadata.passengerCount > 5) {
    metadata.priority = 'MEDIUM';
  } else {
    metadata.priority = 'LOW';
  }

  return metadata;
};

/**
 * GET /api/fleet-tasks - Get all fleet tasks with pagination and filtering
 */
const getAllFleetTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    // Build query based on filters
    const query = {};
    if (req.query.companyId) query.companyId = parseInt(req.query.companyId);
    if (req.query.status) query.status = req.query.status.toUpperCase();
    if (req.query.vehicleId) query.vehicleId = parseInt(req.query.vehicleId);
    if (req.query.driverId) query.driverId = parseInt(req.query.driverId);
    if (req.query.projectId) query.projectId = parseInt(req.query.projectId);

    // Date range filtering
    if (req.query.startDate && req.query.endDate) {
      query.taskDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    // Populate related data with formatted times
    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [company, driver, employee, project, vehicle] = await Promise.all([
          Company.findOne({ id: task.companyId }),
          Employee.findOne({ id: task.driverId }),
          Employee.findOne({ id: task.employeeId }),
          Project.findOne({ id: task.projectId }),
          FleetVehicle.findOne({ id: task.vehicleId }),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          // Format times for display (same format as email)
          plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
          plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
          actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
          actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
          companyName: company ? company.name : 'Unknown Company',
          tenantCode: company ? company.tenantCode : 'N/A',
          driverName: driver ? driver.fullName : 'Unknown Driver',
          employeeFullName: employee ? employee.fullName : 'Unknown Employee',
          projectName: project ? project.name : 'Unknown Project',
          vehicleCode: vehicle
            ? `${vehicle.vehicleCode || vehicle.registrationNo || 'Unknown'}`
            : 'Unknown Vehicle',
        };
      })
    );

    const total = await FleetTask.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fleet tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching fleet tasks: ${error.message}`,
    });
  }
};

/**
 * GET /api/fleet-tasks/:id - Get single fleet task by ID
 */
const getFleetTaskById = async (req, res) => {
  try {
    let fleetTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      fleetTask = await FleetTask.findOne({ id: parseInt(req.params.id) });
    } else {
      fleetTask = await FleetTask.findById(req.params.id);
    }

    if (!fleetTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    // Populate related data
    const [company, driver, vehicle, project] = await Promise.all([
      Company.findOne({ id: fleetTask.companyId }),
      Employee.findOne({ id: fleetTask.driverId }),
      FleetVehicle.findOne({ id: fleetTask.vehicleId }),
      Project.findOne({ id: fleetTask.projectId })
    ]);

    const taskObj = fleetTask.toObject();

    const taskWithDetails = {
      ...taskObj,
      // Format times for display (same format as email)
      plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
      plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
      actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
      actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A',
      driverName: driver ? driver.fullName : 'Unknown Driver',
      vehicleDetails: vehicle ? {
        vehicleCode: vehicle.vehicleCode,
        registrationNo: vehicle.registrationNo,
        vehicleType: vehicle.vehicleType
      } : null,
      projectName: project ? project.name : 'Unknown Project'
    };

    res.json({
      success: true,
      data: taskWithDetails
    });
  } catch (error) {
    console.error('Error fetching fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching fleet task: ${error.message}`
    });
  }
};

/**
 * POST /api/fleet-tasks - Create new fleet task
 */
const createFleetTask = async (req, res) => {
  try {
    console.log('🚗 Executing fleet task creation process...');
    console.log('📅 Original input times:', {
      plannedPickupTime: req.body.plannedPickupTime,
      plannedDropTime: req.body.plannedDropTime
    });

    // Input validation
    const validationErrors = validateFleetTaskInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(', ')
      });
    }

    // Normalize input data
    const normalizedData = normalizeFleetTaskData(req.body);
    
    console.log('🕒 After normalization:', {
      plannedPickupTime: normalizedData.plannedPickupTime,
      plannedDropTime: normalizedData.plannedDropTime
    });

    // Generate new ID if not provided
    if (!normalizedData.id) {
      const lastTask = await FleetTask.findOne().sort({ id: -1 });
      normalizedData.id = lastTask ? lastTask.id + 1 : 1;
    }

    // Referential integrity validation
    const referentialCheck = await validateReferentialIntegrity(
      normalizedData.companyId, 
      normalizedData.vehicleId, 
      normalizedData.driverId,
      normalizedData.projectId
    );

    if (!referentialCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: referentialCheck.errors.join(', ')
      });
    }

    // Generate task metadata
    const taskMetadata = generateTaskMetadata(normalizedData);

    // Create fleet task
    const fleetTaskData = {
      ...normalizedData,
      metadata: taskMetadata,
      updatedAt: new Date()
    };

    const fleetTask = new FleetTask(fleetTaskData);
    const savedTask = await fleetTask.save();

    // Send email notification to driver if assigned
    if (normalizedData.driverId) {
      const [driver, project, vehicle, user] = await Promise.all([
        Employee.findOne({ id: normalizedData.driverId }),
        Project.findOne({ id: normalizedData.projectId }),
        FleetVehicle.findOne({ id: normalizedData.vehicleId }),
        User.findOne({ id: normalizedData.driverId }),
      ]);

      if (user && user.email && driver) {
        const emailSubject = `🚐 New Trip Assigned — ${project ? project.name : 'New Task'}`;
        const emailBody = `
          <h2>New Trip Assigned 🚐</h2>
          <p>Hello ${driver.fullName},</p>
          <p>You have been assigned a new transport trip.</p>
          <ul>
            <li><strong>Project:</strong> ${project ? project.name : 'N/A'}</li>
            <li><strong>Vehicle:</strong> ${vehicle ? vehicle.registrationNo : 'N/A'}</li>
            <li><strong>Start Time:</strong> ${formatTimeForDisplay(normalizedData.plannedPickupTime)}</li>
            <li><strong>End Time:</strong> ${formatTimeForDisplay(normalizedData.plannedDropTime)}</li>
          </ul>
          <p>Click below to view your assigned trips:</p>
          <a href="${process.env.DRIVER_APP_URL || '#'}/tasks"
             style="background-color: #007bff;
                    color: #fff;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;">
             🔗 View My Tasks
          </a>
          <p style="margin-top:20px;">Regards,<br/>Fleet Management System</p>
        `;

        await sendEmailNotification(user.email, emailSubject, emailBody);
      }
    }

    // Populate response data
    const [company, driver, vehicle, project] = await Promise.all([
      Company.findOne({ id: savedTask.companyId }),
      Employee.findOne({ id: savedTask.driverId }),
      FleetVehicle.findOne({ id: savedTask.vehicleId }),
      Project.findOne({ id: savedTask.projectId })
    ]);

    const taskObj = savedTask.toObject();

    const responseData = {
      ...taskObj,
      // Format times for response (same format as email)
      plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
      plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
      actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
      actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A',
      driverName: driver ? driver.fullName : 'Unknown Driver',
      vehicleCode: vehicle ? vehicle.registrationNo : 'Unknown Vehicle',
      projectName: project ? project.name : 'Unknown Project'
    };

    console.log(`✅ Fleet task creation successful: Task ${savedTask.id}`);
    console.log('📋 Final display times:', {
      plannedPickupTime: responseData.plannedPickupTimeDisplay,
      plannedDropTime: responseData.plannedDropTimeDisplay
    });

    res.status(201).json({
      success: true,
      message: 'Fleet task created successfully',
      data: responseData,
      metadata: {
        priority: taskMetadata.priority,
        estimatedDuration: taskMetadata.estimatedDuration,
        requiresAttention: taskMetadata.requiresSpecialAttention
      }
    });

  } catch (error) {
    console.error('❌ Fleet task creation process failed:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Data validation error',
        errors: errors
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Fleet task with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: `Error creating fleet task: ${error.message}`
    });
  }
};

/**
 * PUT /api/fleet-tasks/:id - Update fleet task
 */
const updateFleetTask = async (req, res) => {
  try {
    const updateData = normalizeFleetTaskData(req.body);
    updateData.updatedAt = new Date();

    console.log('🔄 Updating fleet task with time data:', {
      plannedPickupTime: updateData.plannedPickupTime,
      plannedDropTime: updateData.plannedDropTime
    });

    let updatedTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      updatedTask = await FleetTask.findOneAndUpdate(
        { id: parseInt(req.params.id) },
        updateData,
        { new: true, runValidators: true }
      );
    } else {
      updatedTask = await FleetTask.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    // Populate response
    const company = await Company.findOne({ id: updatedTask.companyId });
    const taskObj = updatedTask.toObject();
    
    const taskWithCompany = {
      ...taskObj,
      // Format times for response (same format as email)
      plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
      plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
      actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
      actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
      companyName: company ? company.name : 'Unknown Company',
      tenantCode: company ? company.tenantCode : 'N/A'
    };

    res.json({
      success: true,
      message: 'Fleet task updated successfully',
      data: taskWithCompany
    });
  } catch (error) {
    console.error('Error updating fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error updating fleet task: ${error.message}`
    });
  }
};

/**
 * DELETE /api/fleet-tasks/:id - Delete fleet task
 */
const deleteFleetTask = async (req, res) => {
  try {
    let deletedTask;
    if (req.params.id.match(/^[0-9]+$/)) {
      deletedTask = await FleetTask.findOneAndDelete({ id: parseInt(req.params.id) });
    } else {
      deletedTask = await FleetTask.findByIdAndDelete(req.params.id);
    }

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: 'Fleet task not found'
      });
    }

    res.json({
      success: true,
      message: 'Fleet task deleted successfully',
      data: deletedTask
    });
  } catch (error) {
    console.error('Error deleting fleet task:', error);
    res.status(500).json({
      success: false,
      message: `Error deleting fleet task: ${error.message}`
    });
  }
};

/**
 * GET /api/fleet-tasks/company/:companyId - Get fleet tasks by company
 */
const getFleetTasksByCompany = async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const company = await Company.findOne({ id: companyId });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const query = { companyId };
    
    // Additional filters
    if (req.query.status) query.status = req.query.status.toUpperCase();
    if (req.query.startDate && req.query.endDate) {
      query.taskDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [driver, vehicle, project] = await Promise.all([
          Employee.findOne({ id: task.driverId }),
          FleetVehicle.findOne({ id: task.vehicleId }),
          Project.findOne({ id: task.projectId }),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          // Format times for display (same format as email)
          plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
          plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
          actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
          actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
          companyName: company.name,
          tenantCode: company.tenantCode,
          driverName: driver ? driver.fullName : 'Unknown Driver',
          vehicleCode: vehicle ? vehicle.registrationNo : 'Unknown Vehicle',
          projectName: project ? project.name : 'Unknown Project'
        };
      })
    );

    const total = await FleetTask.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      company: {
        id: company.id,
        name: company.name,
        tenantCode: company.tenantCode
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching company fleet tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching company fleet tasks: ${error.message}`,
    });
  }
};

/**
 * GET /api/fleet-tasks/status/:status - Get fleet tasks by status
 */
const getFleetTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const validStatuses = ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const query = { status: status.toUpperCase() };
    
    if (req.query.companyId) query.companyId = parseInt(req.query.companyId);
    if (req.query.startDate && req.query.endDate) {
      query.taskDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [company, driver, vehicle] = await Promise.all([
          Company.findOne({ id: task.companyId }),
          Employee.findOne({ id: task.driverId }),
          FleetVehicle.findOne({ id: task.vehicleId }),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          // Format times for display (same format as email)
          plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
          plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
          actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
          actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
          companyName: company ? company.name : 'Unknown Company',
          tenantCode: company ? company.tenantCode : 'N/A',
          driverName: driver ? driver.fullName : 'Unknown Driver',
          vehicleCode: vehicle ? vehicle.registrationNo : 'Unknown Vehicle'
        };
      })
    );

    const total = await FleetTask.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      status: status.toUpperCase(),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching fleet tasks by status:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching fleet tasks by status: ${error.message}`,
    });
  }
};

/**
 * GET /api/fleet-tasks/vehicle/:vehicleId - Get fleet tasks by vehicle
 */
const getFleetTasksByVehicle = async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000;
    const skip = (page - 1) * limit;

    const vehicle = await FleetVehicle.findOne({ id: vehicleId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const query = { vehicleId };
    
    if (req.query.status) query.status = req.query.status.toUpperCase();
    if (req.query.startDate && req.query.endDate) {
      query.taskDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const fleetTasks = await FleetTask.find(query)
      .sort({ taskDate: -1, id: -1 })
      .skip(skip)
      .limit(limit);

    const tasksWithDetails = await Promise.all(
      fleetTasks.map(async (task) => {
        const [company, driver, project] = await Promise.all([
          Company.findOne({ id: task.companyId }),
          Employee.findOne({ id: task.driverId }),
          Project.findOne({ id: task.projectId }),
        ]);

        const taskObj = task.toObject();

        return {
          ...taskObj,
          // Format times for display (same format as email)
          plannedPickupTimeDisplay: formatTimeForDisplay(taskObj.plannedPickupTime),
          plannedDropTimeDisplay: formatTimeForDisplay(taskObj.plannedDropTime),
          actualStartTimeDisplay: formatTimeForDisplay(taskObj.actualStartTime),
          actualEndTimeDisplay: formatTimeForDisplay(taskObj.actualEndTime),
          companyName: company ? company.name : 'Unknown Company',
          tenantCode: company ? company.tenantCode : 'N/A',
          driverName: driver ? driver.fullName : 'Unknown Driver',
          projectName: project ? project.name : 'Unknown Project',
          vehicleCode: vehicle.registrationNo
        };
      })
    );

    const total = await FleetTask.countDocuments(query);

    res.json({
      success: true,
      data: tasksWithDetails,
      vehicle: {
        id: vehicle.id,
        vehicleCode: vehicle.vehicleCode,
        registrationNo: vehicle.registrationNo,
        vehicleType: vehicle.vehicleType
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching vehicle fleet tasks:', error);
    res.status(500).json({
      success: false,
      message: `Error fetching vehicle fleet tasks: ${error.message}`,
    });
  }
};

export {
  getAllFleetTasks,
  getFleetTaskById,
  createFleetTask,
  updateFleetTask,
  deleteFleetTask,
  getFleetTasksByCompany,
  getFleetTasksByStatus,
  getFleetTasksByVehicle
};