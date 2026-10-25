const mongoose = require('mongoose');

const prayerLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true, // 1 to 12
  },
  day: {
    type: Number,
    required: true, // 1 to 31
  },
  // Values: '' (empty), 'prayed' (check ✔), 'qaza' (circle ⭕), 'missed' (cross ❌), 'period' (droplet/flower 🌸/💧)
  fajr: {
    type: String,
    enum: ['', 'prayed', 'qaza', 'missed', 'period'],
    default: '',
  },
  dhuhr: {
    type: String,
    enum: ['', 'prayed', 'qaza', 'missed', 'period'],
    default: '',
  },
  asr: {
    type: String,
    enum: ['', 'prayed', 'qaza', 'missed', 'period'],
    default: '',
  },
  maghrib: {
    type: String,
    enum: ['', 'prayed', 'qaza', 'missed', 'period'],
    default: '',
  },
  isha: {
    type: String,
    enum: ['', 'prayed', 'qaza', 'missed', 'period'],
    default: '',
  },
  tahajjud: {
    type: String,
    enum: ['', 'prayed', 'missed'],
    default: '',
  },
  notes: {
    type: String,
    default: '',
    maxlength: 300,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index so each user has only 1 log per day
prayerLogSchema.index({ userId: 1, year: 1, month: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('PrayerLog', prayerLogSchema);
