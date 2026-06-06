const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  theme: { type: String, required: true },
  soul: { type: String, required: true },
  number: { type: Number, required: true, unique: true },
  status: { type: String, enum: ['upcoming','active','finished'], default: 'upcoming' },
  battlePassLevels: { type: Number, default: 50 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Season', seasonSchema);
