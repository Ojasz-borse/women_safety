const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Debugging: This will print to your terminal when the app starts
console.log("--- Route Handler Check ---");
console.log("getProfile:", typeof userController.getProfile);
console.log("updateProfile:", typeof userController.updateProfile);
console.log("deleteAccount:", typeof userController.deleteAccount);
console.log("---------------------------");

router.get('/profile', protect,userController.getProfile);
router.put('/update-profile', protect, upload.single('profilePhoto'), userController.updateProfile);
router.delete('/delete-account', protect, userController.deleteAccount);
const { addContact, deleteContact } = require('../controllers/userController');

router.post('/contacts', protect, addContact);
router.delete('/contacts/:contactId', protect, deleteContact);
module.exports = router;