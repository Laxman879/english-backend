const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', storyController.getStories);
router.post('/generate', storyController.generateStory);
router.delete('/:id', storyController.deleteStory);
router.put('/:id', storyController.updateStory);

module.exports = router;
