const express = require('express');
const router = express.Router();
const { 
    getContacts, 
    addContact, 
    updateContact, 
    deleteContact 
} = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

// All routes here are protected
router.use(protect);

router.route('/')
    .get(getContacts)
    .post(addContact);

router.route('/:contactId')
    .put(updateContact)
    .delete(deleteContact);

module.exports = router;