// routes/utilRoutes.js
const express = require('express');
const router = express.Router();
const { scheduleFakeCall } = require('../controllers/fakeCallController');
const { protect } = require('../middleware/authMiddleware');

router.post('/fake-call', protect, scheduleFakeCall);

module.exports = router;