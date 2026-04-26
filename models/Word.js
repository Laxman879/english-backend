const mongoose = require("mongoose");

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  image: String,
  meaning: String,
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  examples: {
    present: String,
    past: String,
    future: String
  },
  audioUrl: String
}, { timestamps: true });

module.exports = mongoose.model("Word", wordSchema);
