const express = require('express');
const router = express.Router();
const {
    sendInvite,
    acceptInvite,
    declineInvite,
    removeCollaborator,
    getCollaborationStatus,
    getMergedContacts
} = require('../controllers/collaborationController');
const { protect } = require('../middleware/authMiddleware');

// All routes here are protected
router.use(protect);

router.post('/invite', sendInvite);
router.post('/accept', acceptInvite);
router.post('/decline', declineInvite);
router.delete('/remove', removeCollaborator);
router.get('/status', getCollaborationStatus);
router.get('/contacts', getMergedContacts);

module.exports = router;
