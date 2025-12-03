import mongoose from 'mongoose';

const fleetTaskSchema = new mongoose.Schema({
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
  projectId: {
    type: Number,
    index: true
  },
  driverId: {
    type: Number,
    index: true
  },
  vehicleId: {
    type: Number,
    required: true,
    index: true
  },
  taskDate: {
    type: Date,
    required: true,
    index: true
  },
  plannedPickupTime: {
    type: Date,
    index: true
  },
  plannedDropTime: {
    type: Date,
    index: true
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  pickupAddress: {
    type: String,
    trim: true
  },
  dropLocation: {
    type: String,
    trim: true
  },
  dropAddress: {
    type: String,
    trim: true
  },
  expectedPassengers: {
    type: Number,
    default: 0
  },
  actualStartTime: {
    type: Date,
    index: true
  },
  actualEndTime: {
    type: Date,
    index: true
  },
  routeLog: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED',
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Number,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'fleetTasks',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Add essential indexes
fleetTaskSchema.index({ companyId: 1, taskDate: -1 });
fleetTaskSchema.index({ vehicleId: 1, taskDate: -1 });
fleetTaskSchema.index({ status: 1, taskDate: -1 });

export default mongoose.model('FleetTask', fleetTaskSchema);