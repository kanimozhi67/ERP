import express from 'express';
import {
  createCompany,
  getCompanies,
  getCompanyById,
  getCompanyByTenantCode,
  updateCompany,
  deleteCompany
} from '../controllers/companyController.js';

const router = express.Router();

// GET /api/companies - Get all companies
router.get('/', getCompanies);

// POST /api/companies - Create new company
router.post('/', createCompany);

// PUT /api/companies/:id - Update company
router.put('/:id', updateCompany);

// DELETE /api/companies/:id - Delete company
router.delete('/:id', deleteCompany);

// GET /api/companies/:id - Get company by ID
router.get('/:id', getCompanyById);

// GET /api/companies/tenant/:tenantCode - Get company by tenant code
router.get('/tenant/:tenantCode', getCompanyByTenantCode);

export default router;