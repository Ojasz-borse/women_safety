const express = require('express');
const router = express.Router();
const { getNearbyServices } = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');

// Using a dynamic param ':type' to keep code clean
router.get('/:type', protect, getNearbyServices);

module.exports = router;