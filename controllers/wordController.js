const Word = require("../models/Word");
const User = require("../models/User");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SUPPORTED_LANGUAGES = [
  'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam',
  'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Odia',
  'Assamese', 'Urdu', 'Sanskrit', 'Konkani', 'Manipuri',
  'Bodo', 'Dogri', 'Kashmiri', 'Maithili', 'Santali',
  'Sindhi', 'Nepali'
];

exports.getLanguages = (req, res) => {
  res.json(SUPPORTED_LANGUAGES);
};

exports.getWords = async (req, res) => {
  try {
    const words = await Word.find();
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFeaturedWord = async (req, res) => {
  try {
    const totalSaved = await Word.countDocuments();
    if (totalSaved === 0) {
      return res.status(404).json({ message: 'No featured word found' });
    }
    const recent = await Word.findOne().sort({ createdAt: -1 });
    res.json({ word: recent, totalSaved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWordById = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) return res.status(404).json({ message: "Word not found" });
    res.json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRelatedWords = async (req, res) => {
  try {
    const word = await Word.findById(req.params.id);
    if (!word) return res.status(404).json({ message: 'Word not found' });

    const prompt = `Give synonyms and antonyms for the English word "${word.word}".
Return ONLY valid JSON: { "synonyms": ["word1","word2","word3","word4","word5"], "antonyms": ["word1","word2","word3"] }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(completion.choices[0].message.content);
    res.json({ synonyms: data.synonyms || [], antonyms: data.antonyms || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createWord = async (req, res) => {
  try {
    const word = new Word(req.body);
    await word.save();
    res.status(201).json(word);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteWord = async (req, res) => {
  try {
    await Word.findByIdAndDelete(req.params.id);
    res.json({ message: 'Word deleted' });
  } catch (error) {
    console.error('deleteWord error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateExamples = async (req, res) => {
  try {
    const { present, past, future } = req.body;
    const word = await Word.findById(req.params.id);
    if (!word) return res.status(404).json({ message: "Word not found" });
    if (!word.examples) word.examples = {};
    if (present !== undefined) word.examples.present = present;
    if (past !== undefined) word.examples.past = past;
    if (future !== undefined) word.examples.future = future;
    await word.save();
    res.json(word);
  } catch (error) {
    console.error('updateExamples error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.updateWord = async (req, res) => {
  try {
    const { image, meaning, word: wordText } = req.body;
    const wordDoc = await Word.findById(req.params.id);
    if (!wordDoc) return res.status(404).json({ message: "Word not found" });
    if (image !== undefined) wordDoc.image = image;
    if (meaning !== undefined) wordDoc.meaning = meaning;
    if (wordText !== undefined) wordDoc.word = wordText;
    await wordDoc.save();
    res.json(wordDoc);
  } catch (error) {
    console.error('updateWord error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.generateWord = async (req, res) => {
  try {
    const { word, imageUrl } = req.body;
    if (!word) return res.status(400).json({ message: 'Word is required' });

    const LANG_CODES = {
      hindi: 'hi', telugu: 'te', tamil: 'ta', kannada: 'kn', malayalam: 'ml',
      bengali: 'bn', marathi: 'mr', gujarati: 'gu', punjabi: 'pa', odia: 'or',
      assamese: 'as', urdu: 'ur', sanskrit: 'sa', konkani: 'kok', manipuri: 'mni',
      bodo: 'brx', dogri: 'doi', kashmiri: 'ks', maithili: 'mai', santali: 'sat',
      sindhi: 'sd', nepali: 'ne'
    };

    // Build translations for ALL languages via Google Translate
    const allTranslations = {};
    await Promise.all(
      Object.entries(LANG_CODES).map(async ([langKey, langCode]) => {
        try {
          const gtRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(word)}`);
          const gtData = await gtRes.json();
          const translation = gtData?.[0]?.[0]?.[0];
          if (translation && translation.toLowerCase() !== word.toLowerCase()) {
            allTranslations[langKey] = translation;
          }
        } catch (e) {}
      })
    );

    // Get meaning + examples via Groq
    const prompt = `Analyze the English word "${word}". Return ONLY valid JSON:
{
  "meaning": "Clear and concise English definition.",
  "examples": {
    "past": "A sentence using the word in past tense.",
    "present": "A sentence using the word in present tense.",
    "future": "A sentence using the word in future tense."
  }
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const parsedData = JSON.parse(chatCompletion.choices[0].message.content);

    let image = imageUrl || '';
    if (!image) {
      try {
        const imgRes = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&per_page=1&client_id=demo`);
        if (!imgRes.ok) throw new Error();
        const imgData = await imgRes.json();
        image = imgData.results?.[0]?.urls?.regular || '';
      } catch (e) {}
      if (!image) image = `https://source.unsplash.com/800x600/?${encodeURIComponent(word)}`;
    }

    const newWord = new Word({
      word,
      image,
      meaning: parsedData.meaning,
      translations: allTranslations,
      examples: {
        past:    parsedData.examples?.past    || '',
        present: parsedData.examples?.present || '',
        future:  parsedData.examples?.future  || ''
      }
    });

    await newWord.save();
    res.status(201).json(newWord);
  } catch (error) {
    console.error('AI word generation failed', error);
    res.status(500).json({ error: error.message });
  }
};
