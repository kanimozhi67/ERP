import express from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  getUsersByStatus,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with pagination and filtering
 * @access  Public
 * @param   {number} [page=1] - Page number
 * @param   {number} [limit=10] - Number of users per page
 * @param   {string} [sortBy=createdAt] - Field to sort by
 * @param   {string} [sortOrder=desc] - Sort order (asc/desc)
 * @param   {boolean} [isActive] - Filter by active status
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics and analytics
 * @access  Public
 */
router.get('/stats', getUserStats);

/**
 * @route   GET /api/users/status/:isActive
 * @desc    Get users by active status
 * @access  Public
 * @param   {string} isActive - Status filter (true/false)
 */
router.get('/status/:isActive', getUsersByStatus);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Public
 * @param   {number} id - User ID
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Public
 * @body    {Object} User data
 */
router.post('/', createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update existing user
 * @access  Public
 * @param   {number} id - User ID
 * @body    {Object} User update data
 */
router.put('/:id', updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Public
 * @param   {number} id - User ID
 */
router.delete('/:id', deleteUser);

export default router;