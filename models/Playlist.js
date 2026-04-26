const mongoose = require("mongoose");

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  image: String,
  items: [
    {
      type: { type: String, enum: ['word', 'story'] },
      refId: { type: mongoose.Schema.Types.ObjectId, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Playlist", playlistSchema);
