import mongoose from 'mongoose';

const fleetAlertSchema = new mongoose.Schema({
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
  vehicleId: {
    type: Number,
    index: true
  },
  alertType: {
    type: String,
    trim: true,
    index: true
  },
  alertMessage: {
    type: String,
    trim: true
  },
  alertDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolvedAt: {
    type: Date,
    index: true
  },
  createdBy: {
    type: Number,
    index: true
  }
}, {
  collection: 'fleetAlerts'
});

// Add essential indexes
fleetAlertSchema.index({ companyId: 1, alertDate: -1 });
fleetAlertSchema.index({ vehicleId: 1, alertDate: -1 });
fleetAlertSchema.index({ resolvedAt: 1, alertDate: -1 });

export default mongoose.model('FleetAlert', fleetAlertSchema);