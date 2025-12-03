// models/Material.js
import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  unit: {
    type: String
  },
  stock_qty: {
     type: Number, 
     default: 0 
    }
}, {
  timestamps: true
});

const Material = mongoose.model('Material', materialSchema);
export default Material;