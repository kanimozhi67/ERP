import express from 'express';
import {
  createFleetTaskPassenger,
  getFleetTaskPassengers,
  getFleetTaskPassengerById,
  getFleetTaskPassengersByTaskId,
  getFleetTaskPassengersByCompany,
  updateFleetTaskPassenger,
  deleteFleetTaskPassenger
} from '../controllers/fleetTaskPassengerController.js';

const router = express.Router();

/**
 * @route POST /api/fleet-task-passengers
 * @description Create a new fleet task passenger
 * @body {Object} passengerData - Passenger data
 * @body {number} passengerData.id - Passenger ID (required)
 * @body {number} passengerData.companyId - Company ID (required)
 * @body {number} passengerData.fleetTaskId - Fleet task ID (required)
 * @body {number} passengerData.workerEmployeeId - Worker employee ID (required)
 * @body {string} [passengerData.employeeName] - Employee name
 * @body {string} [passengerData.employeeCode] - Employee code
 * @body {string} [passengerData.department] - Department
 * @body {string} [passengerData.status] - Status (PLANNED/PICKED/DROPPED/ABSENT)
 * @body {Date} [passengerData.pickupConfirmedAt] - Pickup confirmation timestamp
 * @body {Date} [passengerData.dropConfirmedAt] - Drop confirmation timestamp
 * @body {string} [passengerData.notes] - Notes
 * @access Public
 */
router.post('/', createFleetTaskPassenger);

/**
 * @route GET /api/fleet-task-passengers
 * @description Get all fleet task passengers with pagination and filtering
 * @query {number} [page=1] - Page number
 * @query {number} [limit=1000] - Items per page
 * @query {number} [companyId] - Filter by company ID
 * @query {number} [fleetTaskId] - Filter by fleet task ID
 * @query {number} [workerEmployeeId] - Filter by worker employee ID
 * @query {string} [status] - Filter by status
 * @query {Date} [dateFrom] - Filter by creation date from
 * @query {Date} [dateTo] - Filter by creation date to
 * @access Public
 */
router.get('/', getFleetTaskPassengers);

/**
 * @route GET /api/fleet-task-passengers/:id
 * @description Get fleet task passenger by ID (supports both numeric and MongoDB IDs)
 * @param {string} id - Passenger ID (numeric or MongoDB ObjectId)
 * @access Public
 */
router.get('/:id', getFleetTaskPassengerById);

/**
 * @route GET /api/fleet-task-passengers/task/:taskId
 * @description Get all passengers for a specific fleet task (supports both numeric and MongoDB IDs)
 * @param {string} taskId - Fleet task ID (numeric or MongoDB ObjectId)
 * @access Public
 */
router.get('/task/:taskId', getFleetTaskPassengersByTaskId);

/**
 * @route GET /api/fleet-task-passengers/company/:companyId
 * @description Get all passengers for a specific company (supports both numeric and MongoDB IDs)
 * @param {string} companyId - Company ID (numeric or MongoDB ObjectId)
 * @access Public
 */
router.get('/company/:companyId', getFleetTaskPassengersByCompany);

/**
 * @route PUT /api/fleet-task-passengers/:id
 * @description Update fleet task passenger by ID (supports both numeric and MongoDB IDs)
 * @param {string} id - Passenger ID (numeric or MongoDB ObjectId)
 * @body {Object} passengerData - Passenger data to update
 * @body {number} [passengerData.companyId] - Company ID
 * @body {number} [passengerData.fleetTaskId] - Fleet task ID
 * @body {number} [passengerData.workerEmployeeId] - Worker employee ID
 * @body {string} [passengerData.employeeName] - Employee name
 * @body {string} [passengerData.employeeCode] - Employee code
 * @body {string} [passengerData.department] - Department
 * @body {string} [passengerData.status] - Status (PLANNED/PICKED/DROPPED/ABSENT)
 * @body {Date} [passengerData.pickupConfirmedAt] - Pickup confirmation timestamp
 * @body {Date} [passengerData.dropConfirmedAt] - Drop confirmation timestamp
 * @body {string} [passengerData.notes] - Notes
 * @access Public
 */
router.put('/:id', updateFleetTaskPassenger);

/**
 * @route DELETE /api/fleet-task-passengers/:id
 * @description Delete fleet task passenger by ID (supports both numeric and MongoDB IDs)
 * @param {string} id - Passenger ID (numeric or MongoDB ObjectId)
 * @access Public
 */
router.delete('/:id', deleteFleetTaskPassenger);

export default router;