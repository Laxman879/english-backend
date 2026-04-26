const mongoose = require("mongoose");

const savedWordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Word', required: true },
  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SavedWord", savedWordSchema);
