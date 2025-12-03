import express from 'express';
import {
  getAllFleetTasks,
  getFleetTaskById,
  createFleetTask,
  updateFleetTask,
  deleteFleetTask
} from '../controllers/fleetTaskController.js';

const router = express.Router();

// GET /api/fleet-tasks - Get all fleet tasks
router.get('/', getAllFleetTasks);

// GET /api/fleet-tasks/:id - Get fleet task by ID
router.get('/:id', getFleetTaskById);

// POST /api/fleet-tasks - Create new fleet task
router.post('/', createFleetTask);

// PUT /api/fleet-tasks/:id - Update fleet task
router.put('/:id', updateFleetTask);

// DELETE /api/fleet-tasks/:id - Delete fleet task
router.delete('/:id', deleteFleetTask);

export default router;
