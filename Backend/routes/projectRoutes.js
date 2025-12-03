import express from 'express';
import {
  getAllProjects,
  getProjectsByCompany,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
} from '../controllers/projectController.js';

const router = express.Router();

// GET /api/projects - Get all projects
router.get('/', getAllProjects);

// GET /api/projects/stats/:companyId - Get project statistics for company
router.get('/stats/:companyId', getProjectStats);

// GET /api/projects/company/:companyId - Get projects by company ID
router.get('/company/:companyId', getProjectsByCompany);

// GET /api/projects/:id - Get project by numeric ID
router.get('/:id', getProjectById);

// POST /api/projects - Create new project
router.post('/', createProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

export default router;