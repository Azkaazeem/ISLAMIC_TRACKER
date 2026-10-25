const mongoose = require('mongoose');

const quranLogSchema = new mongoose.Schema({
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
    required: true,
  },
  day: {
    type: Number,
    required: true,
  },
  juz: {
    type: Number,
    min: 1,
    max: 30,
    default: 1,
  },
  surah: {
    type: String,
    default: '',
    trim: true,
  },
  ayahRange: {
    type: String,
    default: '',
    trim: true,
  },
  pagesCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QuranLog', quranLogSchema);
