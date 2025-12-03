import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
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
  projectCode: {
    type: String,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  jobNature: {
    type: String,
    trim: true
  },
  jobSubtype: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    index: true
  },
  endDate: {
    type: Date,
    index: true
  },
  budget: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Planned', 'Ongoing', 'Completed', 'Warranty', 'Cancelled'],
    default: 'Planned',
    index: true
  },
  permitRequired: {
    type: Boolean,
    default: false
  },
  permitStatus: {
    type: String,
    trim: true
  },
  siteGeo: {
    type: Object
  },
  sitePoint: {
    type: Object
  },
  address: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: Object,
    default: {}
  },
  meta: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: Number,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Add essential indexes
projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ companyId: 1, startDate: -1 });

export default mongoose.model('Project', projectSchema);