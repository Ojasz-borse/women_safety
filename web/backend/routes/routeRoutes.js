// routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const { getHighRiskZones, checkRouteSafety } = require('../controllers/routeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/high-risk-zones', protect, getHighRiskZones);
router.post('/safe-route', protect, checkRouteSafety);

module.exports = router;