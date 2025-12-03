// models/FleetTaskMaterial.js
import mongoose from 'mongoose';

const fleetTaskMaterialSchema = new mongoose.Schema({
  fleetTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetTask',
    required: true
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const FleetTaskMaterial = mongoose.model('FleetTaskMaterial', fleetTaskMaterialSchema);
export default FleetTaskMaterial;