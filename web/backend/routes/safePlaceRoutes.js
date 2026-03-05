const express = require('express');
const router = express.Router();
const { getNearbyHelp } = require('../controllers/safePlaceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/nearby', protect, getNearbyHelp);

module.exports = router;