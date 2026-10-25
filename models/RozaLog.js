const mongoose = require('mongoose');

const rozaLogSchema = new mongoose.Schema({
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
  // Values: '' (unmarked), 'kept' (fasted), 'missed' (qaza needed), 'exempt' (mensis/illness/travel), 'nafl' (voluntary)
  status: {
    type: String,
    enum: ['', 'kept', 'missed', 'exempt', 'nafl'],
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

rozaLogSchema.index({ userId: 1, year: 1, month: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('RozaLog', rozaLogSchema);
