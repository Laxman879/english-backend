const express = require('express');
const router = express.Router();
const savedWordController = require('../controllers/savedWordController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', savedWordController.getSavedWords);
router.post('/', savedWordController.saveWord);
router.delete('/:id', savedWordController.removeSavedWord);

module.exports = router;
