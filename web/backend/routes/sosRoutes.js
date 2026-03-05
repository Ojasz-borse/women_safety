const express = require('express');
const router = express.Router();
// We import the whole object as sosController
const sosController = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');

// You must prefix the functions with 'sosController.'
router.post('/trigger', protect, sosController.triggerSOS);
router.post('/voice-trigger', protect, sosController.voiceTriggerSOS); // Fixed line
router.post('/shake-trigger', protect, sosController.shakeTriggerSOS);
router.post('/resolve', protect, sosController.resolveSOS);
router.post('/cancel', protect, sosController.cancelSOS);
router.put('/update-location', protect, sosController.updateSOSLocation);
router.get('/status', protect, sosController.getSOSStatus);

module.exports = router;