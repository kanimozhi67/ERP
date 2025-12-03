// models/Tool.js
import mongoose from 'mongoose';

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  quantityAvailable: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Tool = mongoose.model('Tool', toolSchema);
export default Tool;