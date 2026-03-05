const express = require('express');
const router = express.Router();
const { reportIncident, getHeatmapData } = require('../controllers/incidentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/report', protect, reportIncident);
router.get('/heatmap', getHeatmapData); // Usually public so all users see danger zones

module.exports = router;