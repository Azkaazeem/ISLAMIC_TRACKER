require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const PrayerLog = require('./models/PrayerLog');
const RozaLog = require('./models/RozaLog');
const QuranLog = require('./models/QuranLog');
const MoodLog = require('./models/MoodLog');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'namaz_tracker_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  express.static(path.join(__dirname, 'public'), {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    },
  })
);

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://azkaazeem804_db_user:mlEHKIIXFr5xIYaW@cluster0.y6qrf3a.mongodb.net/namaz_tracker?retryWrites=true&w=majority';

mongoose
  .connect(mongoUri)
  .then(() => console.log('✓ Successfully connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
  });

// Helper: Check if female is eligible for period gap (female & age >= 10)
const isPeriodEligible = (user) => {
  return user.gender === 'female' && Number(user.age) >= 10;
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// 1. Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, gender, age, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !gender || !age || !password) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and Confirm Password do not match.' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be either male or female.' });
    }

    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 3 || parsedAge > 120) {
      return res.status(400).json({ error: 'Please enter a valid age between 3 and 120.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      gender,
      age: parsedAge,
      password: hashedPassword,
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age,
        settings: user.settings,
        canHavePeriod: isPeriodEligible(user),
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup: ' + error.message });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age,
        settings: user.settings,
        canHavePeriod: isPeriodEligible(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
});

// 3. Current User Profile
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        gender: req.user.gender,
        age: req.user.age,
        settings: req.user.settings,
        canHavePeriod: isPeriodEligible(req.user),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// 4. Update Profile / Settings
app.put('/api/auth/profile', auth, async (req, res) => {
  try {
    const { name, age, gender, settings } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (age) user.age = parseInt(age, 10);
    if (gender && ['male', 'female'].includes(gender)) user.gender = gender;
    if (settings) {
      user.settings = {
        ...user.settings,
        ...settings,
      };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        age: user.age,
        settings: user.settings,
        canHavePeriod: isPeriodEligible(user),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==========================================
// NAMAZ TRACKER ROUTES
// ==========================================

// Get all prayer logs for a given month
app.get('/api/prayers/month/:year/:month', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    const logs = await PrayerLog.find({
      userId: req.user._id,
      year,
      month,
    }).sort({ day: 1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prayer logs.' });
  }
});

// Update or set status for a single prayer or whole day
app.post('/api/prayers/day', auth, async (req, res) => {
  try {
    const { year, month, day, fajr, dhuhr, asr, maghrib, isha, tahajjud, notes } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Year, month, and day are required.' });
    }

    const eligible = isPeriodEligible(req.user);

    // Validate that 'period' can only be set if user is female and age >= 10
    const sanitizeStatus = (val) => {
      if (val === 'period' && !eligible) return '';
      return ['prayed', 'qaza', 'missed', 'period', ''].includes(val) ? val : '';
    };

    let log = await PrayerLog.findOne({
      userId: req.user._id,
      year,
      month,
      day,
    });

    if (!log) {
      log = new PrayerLog({
        userId: req.user._id,
        year,
        month,
        day,
      });
    }

    if (fajr !== undefined) log.fajr = sanitizeStatus(fajr);
    if (dhuhr !== undefined) log.dhuhr = sanitizeStatus(dhuhr);
    if (asr !== undefined) log.asr = sanitizeStatus(asr);
    if (maghrib !== undefined) log.maghrib = sanitizeStatus(maghrib);
    if (isha !== undefined) log.isha = sanitizeStatus(isha);
    if (tahajjud !== undefined) log.tahajjud = ['prayed', 'missed', ''].includes(tahajjud) ? tahajjud : '';
    if (notes !== undefined) log.notes = notes;

    log.updatedAt = new Date();
    await log.save();

    res.json({ message: 'Prayer log saved!', log });
  } catch (error) {
    console.error('Error saving prayer log:', error);
    res.status(500).json({ error: 'Failed to save prayer log.' });
  }
});

// Quick action: Bulk mark whole day (e.g., mark day as Period 🌸 or mark All as Prayed ✔)
app.post('/api/prayers/day-bulk', auth, async (req, res) => {
  try {
    const { year, month, day, action } = req.body;

    if (!year || !month || !day || !action) {
      return res.status(400).json({ error: 'Missing parameters.' });
    }

    const eligible = isPeriodEligible(req.user);

    let log = await PrayerLog.findOne({
      userId: req.user._id,
      year,
      month,
      day,
    });

    if (!log) {
      log = new PrayerLog({
        userId: req.user._id,
        year,
        month,
        day,
      });
    }

    if (action === 'period') {
      if (!eligible) {
        return res.status(403).json({ error: 'Period status is not applicable for this profile.' });
      }
      log.fajr = 'period';
      log.dhuhr = 'period';
      log.asr = 'period';
      log.maghrib = 'period';
      log.isha = 'period';
    } else if (action === 'all_prayed') {
      log.fajr = 'prayed';
      log.dhuhr = 'prayed';
      log.asr = 'prayed';
      log.maghrib = 'prayed';
      log.isha = 'prayed';
    } else if (action === 'clear_day') {
      log.fajr = '';
      log.dhuhr = '';
      log.asr = '';
      log.maghrib = '';
      log.isha = '';
      log.tahajjud = '';
    }

    log.updatedAt = new Date();
    await log.save();

    res.json({ message: 'Day status updated!', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update bulk day status.' });
  }
});

// Monthly Prayer Statistics
app.get('/api/prayers/stats/month/:year/:month', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    const logs = await PrayerLog.find({
      userId: req.user._id,
      year,
      month,
    });

    let stats = {
      prayed: 0,
      qaza: 0,
      missed: 0,
      period: 0,
      tahajjud: 0,
      totalMarked: 0,
    };

    const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    logs.forEach((log) => {
      prayerKeys.forEach((p) => {
        const val = log[p];
        if (val === 'prayed') stats.prayed++;
        else if (val === 'qaza') stats.qaza++;
        else if (val === 'missed') stats.missed++;
        else if (val === 'period') stats.period++;

        if (val) stats.totalMarked++;
      });

      if (log.tahajjud === 'prayed') stats.tahajjud++;
    });

    const daysInMonth = new Date(year, month, 0).getDate();
    const totalObligatory = daysInMonth * 5;
    // Calculate performance score excluding period excused prayers
    const applicableObligatory = Math.max(1, totalObligatory - stats.period);
    const scorePercentage = Math.min(100, Math.round((stats.prayed / applicableObligatory) * 100));

    res.json({
      year,
      month,
      daysInMonth,
      stats: {
        ...stats,
        scorePercentage,
        totalObligatory,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute stats.' });
  }
});

// ==========================================
// ROZA (FASTING) TRACKER ROUTES
// ==========================================

// Get monthly fasting logs
app.get('/api/roza/month/:year/:month', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    const logs = await RozaLog.find({
      userId: req.user._id,
      year,
      month,
    }).sort({ day: 1 });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Roza logs.' });
  }
});

// Update or set fasting status for a day
app.post('/api/roza/day', auth, async (req, res) => {
  try {
    const { year, month, day, status, notes } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Year, month, and day are required.' });
    }

    const validStatuses = ['', 'kept', 'missed', 'exempt', 'nafl'];
    const cleanStatus = validStatuses.includes(status) ? status : '';

    let log = await RozaLog.findOne({
      userId: req.user._id,
      year,
      month,
      day,
    });

    if (!log) {
      log = new RozaLog({
        userId: req.user._id,
        year,
        month,
        day,
      });
    }

    log.status = cleanStatus;
    if (notes !== undefined) log.notes = notes;
    log.updatedAt = new Date();

    await log.save();
    res.json({ message: 'Roza log saved!', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save Roza log.' });
  }
});

// ==========================================
// QURAN TRACKER ROUTES
// ==========================================

// Get monthly Quran logs
app.get('/api/quran/month/:year/:month', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    const logs = await QuranLog.find({
      userId: req.user._id,
      year,
      month,
    }).sort({ day: -1, createdAt: -1 });

    const totalPages = logs.reduce((sum, item) => sum + (item.pagesCount || 0), 0);

    res.json({ logs, totalPages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Quran logs.' });
  }
});

// Add daily Quran log
app.post('/api/quran/log', auth, async (req, res) => {
  try {
    const { year, month, day, juz, surah, ayahRange, pagesCount, notes } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Date is required.' });
    }

    const log = new QuranLog({
      userId: req.user._id,
      year,
      month,
      day,
      juz: juz ? parseInt(juz, 10) : 1,
      surah: surah || '',
      ayahRange: ayahRange || '',
      pagesCount: pagesCount ? parseInt(pagesCount, 10) : 0,
      notes: notes || '',
    });

    await log.save();
    res.status(201).json({ message: 'Quran reading logged!', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save Quran log.' });
  }
});

// Delete Quran log
app.delete('/api/quran/:id', auth, async (req, res) => {
  try {
    await QuranLog.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Quran log entry removed.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

// ==========================================
// MOOD & SPIRITUAL REFLECTION ROUTES
// ==========================================

app.get('/api/mood/today', auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const log = await MoodLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    res.json({ log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mood.' });
  }
});

app.post('/api/mood', auth, async (req, res) => {
  try {
    const { mood, note } = req.body;
    const validMoods = ['peaceful', 'grateful', 'anxious', 'repentant', 'low_iman', 'hopeful'];

    if (!validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood choice.' });
    }

    const log = new MoodLog({
      userId: req.user._id,
      mood,
      note: note || '',
      date: new Date(),
    });

    await log.save();
    res.json({ message: 'Spiritual state recorded!', log });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save mood.' });
  }
});

// Serve frontend for all remaining GET routes (Express 5 compatibility)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🕌 Namaz Tracker Server is running on port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
