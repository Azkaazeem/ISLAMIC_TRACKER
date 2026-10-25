const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Gender is required'],
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [3, 'Age must be at least 3'],
    max: [120, 'Please enter a realistic age'],
  },
  settings: {
    language: {
      type: String,
      default: 'en',
    },
    city: {
      type: String,
      default: 'Karachi',
    },
    country: {
      type: String,
      default: 'Pakistan',
    },
    tahajjudReminder: {
      type: Boolean,
      default: false,
    },
    tahajjudTime: {
      type: String,
      default: '04:30',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
