import mongoose from 'mongoose';

const fleetTaskPassengerSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true,
    index: true
  },
  fleetTaskId: {
    type: Number,
    required: true,
    index: true
  },
  workerEmployeeId: {
    type: Number,
    required: true,
    index: true
  },
  pickupConfirmedAt: {
    type: Date,
    index: true
  },
  dropConfirmedAt: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['PLANNED', 'PICKED', 'DROPPED', 'ABSENT'],
    default: 'PLANNED',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'fleetTaskPassengers'
});

// Add essential indexes
fleetTaskPassengerSchema.index({ fleetTaskId: 1, status: 1 });
fleetTaskPassengerSchema.index({ workerEmployeeId: 1, createdAt: -1 });

export default mongoose.model('FleetTaskPassenger', fleetTaskPassengerSchema);