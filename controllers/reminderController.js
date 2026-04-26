const User = require('../models/User');

exports.setReminder = async (req, res) => {
  try {
    const { frequency } = req.body;
    const user = await User.findById(req.user.id);
    if(!user) return res.status(404).json({ message: "User not found" });
    user.reminderFrequency = frequency;
    await user.save();
    res.json({ message: "Reminder frequency updated", frequency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
