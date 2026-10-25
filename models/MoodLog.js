const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  mood: {
    type: String,
    enum: ['peaceful', 'grateful', 'anxious', 'repentant', 'low_iman', 'hopeful'],
    required: true,
  },
  note: {
    type: String,
    default: '',
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MoodLog', moodLogSchema);
