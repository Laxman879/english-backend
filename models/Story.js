const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storyText: String,
  image: String,
  audioUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Story", storySchema);
