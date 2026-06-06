const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    fr: { type: String, required: true },
    en: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['classique','flash','image_blind','audio','chronologie','confrontation','wildcard'],
    default: 'classique'
  },
  options: [{
    fr: String,
    en: String
  }],
  correct_index: { type: Number, required: true },
  anime: { type: String, required: true },
  arc: { type: String, default: '' },
  category: { type: String, required: true },
  soul: {
    type: String,
    enum: ['shonen','isekai','seinen','mystere','dark','mecha','slice','fantasy','gore','wildcard']
  },
  difficulty: { type: Number, min: 1, max: 10, default: 5 },
  success_rate: { type: Number, default: 0 },
  times_asked: { type: Number, default: 0 },
  media_url: { type: String, default: null },
  isAIGenerated: { type: Boolean, default: false },
  isValidated: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
