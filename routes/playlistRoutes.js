const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', playlistController.getPlaylists);
router.get('/:id', playlistController.getPlaylistById);
router.post('/', playlistController.createPlaylist);
router.put('/:id/add-item', playlistController.addItem);
router.put('/:id/remove-item', playlistController.removeItem);
router.post('/:id/items', playlistController.addItem);
router.delete('/:id/items', playlistController.removeItem);
router.delete('/:id', playlistController.deletePlaylist);
router.put('/:id', playlistController.updatePlaylist);

module.exports = router;
