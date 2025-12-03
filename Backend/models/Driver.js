import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
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
  employeeId: {
    type: Number,
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  employeeCode: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  licenseNo: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  licenseExpiry: {
    type: Date
  },
  vehicleId: {
    type: Number,
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add only essential indexes
driverSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Driver', driverSchema);