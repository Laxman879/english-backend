const Playlist = require('../models/Playlist');

exports.createPlaylist = async (req, res) => {
  try {
    const { name, image } = req.body;
    const autoImage = image || `https://source.unsplash.com/800x600/?${encodeURIComponent(name)}`;
    const newPlaylist = new Playlist({ userId: req.user.id, name, image: autoImage, items: [] });
    await newPlaylist.save();
    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Not found" });

    const Word = require('../models/Word');
    const Story = require('../models/Story');

    const wordIds  = playlist.items.filter(i => i.type === 'word').map(i => i.refId);
    const storyIds = playlist.items.filter(i => i.type === 'story').map(i => i.refId);

    const [words, stories] = await Promise.all([
      Word.find({ _id: { $in: wordIds } }),
      Story.find({ _id: { $in: storyIds } }),
    ]);

    const serializedWords = words.map(w => {
      const obj = w.toObject();
      if (w.translations instanceof Map) obj.translations = Object.fromEntries(w.translations);
      return obj;
    });

    res.json({ ...playlist.toObject(), words: serializedWords, stories: stories.map(s => s.toObject()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: "Playlist deleted" });
  } catch (error) {
    console.error('deletePlaylist error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updatePlaylist = async (req, res) => {
  try {
    const { name, image } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) return res.status(404).json({ message: "Not found" });
    if (name !== undefined) playlist.name = name;
    if (image !== undefined) playlist.image = image;
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, refId } = req.body;
    const playlist = await Playlist.findById(id);
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    const alreadyExists = playlist.items.some(i => i.refId?.toString() === refId);
    if (!alreadyExists) {
      playlist.items.push({ type, refId });
      await playlist.save();
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { id } = req.params; // playlist ID
    const { itemId } = req.body; // array ID of the item
    const playlist = await Playlist.findById(id);
    if(!playlist) return res.status(404).json({message: "Playlist not found"});
    playlist.items = playlist.items.filter(item => item._id.toString() !== itemId);
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
