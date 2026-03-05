// routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const { startSharing, stopSharing, updateLocation, getUserLocation } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start-sharing', protect, startSharing);
router.post('/stop-sharing', protect, stopSharing);
router.post('/update', protect, updateLocation);
router.get('/:userId', protect, getUserLocation);

module.exports = router;