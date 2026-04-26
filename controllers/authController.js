const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { access_token } = req.body; 
    
    // Verify the Google token by fetching the user profile
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!response.ok) {
      throw new Error("Failed to verify Google token");
    }

    const data = await response.json();
    const { sub: googleId, email, name, picture } = data;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User({ googleId, email, name, avatarUrl: picture });
      await user.save();
    } else {
      // Always sync profile data from Google on every login
      user.avatarUrl = picture || user.avatarUrl;
      user.name = name || user.name;
      user.email = email || user.email;
      await user.save();
    }
    const token = signToken(user._id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    if (user.lastActiveDate) {
      // Calculate day difference roughly
      const last = new Date(user.lastActiveDate);
      const diffTime = now.getTime() - last.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      // If they logged in more than 24 hours ago but less than 48, bump streak
      if (diffHours >= 24 && diffHours < 48) {
        user.streakCount = (user.streakCount || 0) + 1;
      } else if (diffHours >= 48) {
        // Reset streak if more than 48 hours passed
        user.streakCount = 1; 
      }
      // If diffHours < 24 it's the same session/day essentially, do nothing to streak
    } else {
      user.streakCount = 1;
    }
    user.lastActiveDate = now;
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, preferredLanguage, reminderFrequency, reminderTime, reminderRepeat } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (preferredLanguage !== undefined) user.preferredLanguage = preferredLanguage;
    if (reminderFrequency !== undefined) user.reminderFrequency = reminderFrequency;
    if (reminderTime !== undefined) user.reminderTime = reminderTime;
    if (reminderRepeat !== undefined) user.reminderRepeat = reminderRepeat;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.trackTime = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toISOString().split('T')[0];

    if (user.lastStreakDate === today) {
      return res.json({ streakCount: user.streakCount, awarded: false });
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.lastStreakDate === yesterday) {
      user.streakCount = (user.streakCount || 0) + 1;
    } else if (!user.lastStreakDate) {
      user.streakCount = 1;
    } else {
      user.streakCount = 1;
    }

    user.lastStreakDate = today;
    if (!user.streakDates) user.streakDates = [];
    if (!user.streakDates.includes(today)) user.streakDates.push(today);
    await user.save();
    res.json({ streakCount: user.streakCount, awarded: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStreakHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      streakCount: user.streakCount || 0,
      streakDates: user.streakDates || [],
      lastStreakDate: user.lastStreakDate || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
