const SavedWord = require('../models/SavedWord');

exports.saveWord = async (req, res) => {
  try {
    const { wordId } = req.body;
    const userId = req.user.id; // assume req.user from token
    const newSavedWord = new SavedWord({ userId, wordId });
    await newSavedWord.save();
    res.status(201).json(newSavedWord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSavedWords = async (req, res) => {
  try {
    const savedWords = await SavedWord.find({ userId: req.user.id }).populate('wordId').sort({ createdAt: -1 });
    res.json(savedWords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeSavedWord = async (req, res) => {
  try {
    await SavedWord.findByIdAndDelete(req.params.id);
    res.json({ message: "Saved word removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
