import express from 'express';
import {
  createFleetAlert
} from '../controllers/fleetAlertController.js';

const router = express.Router();

router.post('/', createFleetAlert);

export default router;