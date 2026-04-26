const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `http://localhost:5000/uploads/${req.file.filename}` });
});

const authRoutes = require('./routes/authRoutes');
const wordRoutes = require('./routes/wordRoutes');
const savedWordRoutes = require('./routes/savedWordRoutes');
const playlistRoutes = require('./routes/playlistRoutes');
const storyRoutes = require('./routes/storyRoutes');
const reminderRoutes = require('./routes/reminderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/words', wordRoutes);
app.use('/api/saved-words', savedWordRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/reminders', reminderRoutes);

const cron = require('node-cron');
const User = require('./models/User');
const { sendEmail } = require('./utils/sendEmail');

function convertTo24Hour(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;
  return { hours, minutes };
}

function isDueForReminder(user, now) {
  if (!user.reminderFrequency || user.reminderFrequency === 'none') return false;

  const { hours, minutes } = convertTo24Hour(user.reminderTime || '09:00 AM');
  const nowHours = now.getHours();
  const nowMinutes = now.getMinutes();

  if (nowHours !== hours || nowMinutes !== minutes) return false;

  if (user.lastReminderSent) {
    const last = new Date(user.lastReminderSent);
    const diffMs = now.getTime() - last.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const repeat = user.reminderRepeat || 'daily';

    if (repeat === 'daily' && diffHours < 23) return false;
    if (repeat === 'weekly' && diffHours < 167) return false;
    if (repeat === 'monthly' && diffHours < 719) return false;
  }

  return true;
}

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const users = await User.find({
      reminderFrequency: { $ne: 'none' },
      email: { $exists: true, $ne: null }
    });

    let count = 0;
    for (const user of users) {
      if (isDueForReminder(user, now)) {
        const repeat = user.reminderRepeat || 'daily';
        await sendEmail(
          user.email,
          `Words Master - Your ${repeat.charAt(0).toUpperCase() + repeat.slice(1)} Reminder`,
          `Hi ${user.name || 'Learner'},\n\nThis is your ${repeat} reminder to practice vocabulary!\n\n🔥 Current streak: ${user.streakCount || 0} days\n\nKeep learning and don't break your streak!\n\n— Words Master AI`
        );
        user.lastReminderSent = now;
        await user.save();
        count++;
      }
    }
    if (count > 0) console.log(`[CRON] ${count} reminder emails sent`);
  } catch (err) {
    console.error('[CRON] Error:', err.message);
  }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

app.listen(5000, () => console.log("Server running"));
// reload trigger v3
