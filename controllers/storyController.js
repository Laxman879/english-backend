const Story = require('../models/Story');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


exports.generateStory = async (req, res) => {
  try {
    const { words, genre } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ message: "Please provide an array of words" });
    }

    const genreInstruction = genre
      ? `The story must be in the "${genre}" genre. Match the tone, setting, and style of that genre.`
      : 'Topics can be: daily life, friendship, travel, work, love, dreams, nature, city life';

    const prompt = `Write a simple English story in 80-100 words that anyone can understand easily.

Rules:
- Use simple, common English words only
- Keep sentences short and clear (8-10 words max)
- Use simple tenses (present, past)
- Make the story interesting with a clear beginning, middle, and end
- ${genreInstruction}
- Must include these words naturally: ${words.join(", ")}

Do NOT use: idioms, phrasal verbs, slang, or academic vocabulary.
Write like you are talking to a friend in easy English.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 1.0,
      top_p: 0.95,
    });

    const storyText = chatCompletion.choices[0].message.content;

    const imageKeyword = genre || words[0] || 'story';
    const image = `https://source.unsplash.com/800x600/?${encodeURIComponent(imageKeyword)}`;

    const newStory = new Story({
      userId: req.user.id,
      storyText,
      image,
      audioUrl: ""
    });

    await newStory.save();
    res.status(201).json(newStory);
  } catch (error) {
    console.error("AI Story generation failed", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: "Story deleted" });
  } catch (error) {
    console.error('deleteStory error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const { image, storyText } = req.body;
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: "Not found" });
    if (image !== undefined) story.image = image;
    if (storyText !== undefined) story.storyText = storyText;
    await story.save();
    res.json(story);
  } catch (error) {
    console.error('updateStory error:', error.message);
    res.status(500).json({ error: error.message });
  }
};
