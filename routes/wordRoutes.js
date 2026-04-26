const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/languages', wordController.getLanguages);
router.get('/', wordController.getWords);
router.get('/featured', authMiddleware, wordController.getFeaturedWord);
router.post('/generate', authMiddleware, wordController.generateWord);
router.get('/:id', wordController.getWordById);
router.get('/:id/related', authMiddleware, wordController.getRelatedWords);
router.put('/:id/examples', authMiddleware, wordController.updateExamples);
router.put('/:id', authMiddleware, wordController.updateWord);
router.delete('/:id', authMiddleware, wordController.deleteWord);
// Admin route (using simple auth for now)
router.post('/', authMiddleware, wordController.createWord);

module.exports = router;
