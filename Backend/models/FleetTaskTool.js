// models/FleetTaskTool.js
import mongoose from 'mongoose';

const fleetTaskToolSchema = new mongoose.Schema({
  fleetTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FleetTask',
    required: true
  },
  toolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

const FleetTaskTool = mongoose.model('FleetTaskTool', fleetTaskToolSchema);
export default FleetTaskTool;