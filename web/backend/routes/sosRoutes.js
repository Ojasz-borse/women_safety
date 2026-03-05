const express = require('express');
const router = express.Router();
// Use destructuring to pull all functions
const { 
  triggerSOS, 
  getSOSStatus, 
  sendAlert, 
  updateSOSLocation, 
  resolveSOS, 
  cancelSOS 
} = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');

// Define Routes
router.post('/trigger', protect, triggerSOS);
router.post('/cancel', protect, cancelSOS); // Ensure this function exists in controller!
router.get('/status', protect, getSOSStatus);
router.post('/send-alert', protect, sendAlert);
router.put('/update-location', protect, updateSOSLocation);
router.post('/resolve', protect, resolveSOS);

module.exports = router;