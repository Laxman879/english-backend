const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  googleId: String,
  avatarUrl: String,
  preferredLanguage: String,
  streakCount: { type: Number, default: 0 },
  lastActiveDate: Date,
  lastStreakDate: String,
  streakDates: [String],
  password: { type: String, default: null },
  reminderFrequency: { type: String, default: 'none' },
  reminderTime: { type: String, default: '09:00 AM' },
  reminderRepeat: { type: String, default: 'daily' },
  lastReminderSent: Date
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
