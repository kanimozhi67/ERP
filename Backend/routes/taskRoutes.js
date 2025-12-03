import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByStatus,
  getTasksByType
} from '../controllers/taskController.js';

const router = express.Router();

// Task routes
router.get('/', getAllTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/project/:projectId', getTasksByProject);
router.get('/status/:status', getTasksByStatus);
router.get('/type/:taskType', getTasksByType);

export default router;