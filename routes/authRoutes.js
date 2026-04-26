const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/google', authController.googleLogin);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/track-time', authMiddleware, authController.trackTime);
router.get('/streak-history', authMiddleware, authController.getStreakHistory);

module.exports = router;
