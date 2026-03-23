// routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const { getHighRiskZones, getDirections, getSafeRoute } = require('../controllers/routeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/high-risk-zones', protect, getHighRiskZones);
router.get('/directions', protect, getDirections);
router.post('/safe', protect, getSafeRoute);

module.exports = router;