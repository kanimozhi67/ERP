import express from 'express';
import {
  createFleetVehicle,
  getFleetVehicles,
  getFleetVehicleById,
  getFleetVehiclesByCompany,
  getFleetVehiclesByStatus,
  updateFleetVehicle,
  deleteFleetVehicle
} from '../controllers/fleetVehicleController.js';

const router = express.Router();

// Make sure all these functions are exported from your controller
router.post('/', createFleetVehicle);
router.get('/', getFleetVehicles);
router.get('/:id', getFleetVehicleById);
router.get('/company/:companyId', getFleetVehiclesByCompany);
router.get('/status/:status', getFleetVehiclesByStatus);
router.put('/:id', updateFleetVehicle);
router.delete('/:id', deleteFleetVehicle);

export default router;