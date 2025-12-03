import mongoose from 'mongoose';

const companyUserSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  companyId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  role: {
    type: String,
    enum: ['worker', 'admin', 'manager'],
    default: 'worker'
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, {
  collection: 'companyUsers',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
}
  
);


export default mongoose.model('CompanyUser', companyUserSchema);