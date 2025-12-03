import mongoose from 'mongoose';

const fleetVehicleSchema = new mongoose.Schema({
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
  vehicleCode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  registrationNo: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  vehicleType: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE'],
    default: 'AVAILABLE',
    index: true
  },
  insuranceExpiry: {
    type: Date,
    index: true
  },
  lastServiceDate: {
    type: Date,
    index: true
  },
  odometer: {
    type: Number,
    min: 0
  },
  meta: {
    type: Object,
    default: {}
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
  collection: 'fleetVehicles',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Add essential indexes
fleetVehicleSchema.index({ companyId: 1, status: 1 });
fleetVehicleSchema.index({ status: 1, insuranceExpiry: 1 });

export default mongoose.model('FleetVehicle', fleetVehicleSchema);