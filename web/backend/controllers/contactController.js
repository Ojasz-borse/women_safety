const User = require('../models/User');

// @desc    Get all emergency contacts
// @route   GET /api/contacts
exports.getContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            count: user.emergencyContacts.length,
            data: user.emergencyContacts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a new emergency contact
// @route   POST /api/contacts
exports.addContact = async (req, res) => {
    try {
        const { name, phone, relation } = req.body;
        
        const user = await User.findById(req.user.id);

        // Check if contact already exists
        const exists = user.emergencyContacts.find(c => c.phone === phone);
        if (exists) {
            return res.status(400).json({ success: false, message: "Contact already exists" });
        }

        user.emergencyContacts.push({ name, phone, relation });
        await user.save();

        res.status(201).json({ success: true, data: user.emergencyContacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a contact
// @route   PUT /api/contacts/:contactId
exports.updateContact = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const contact = user.emergencyContacts.id(req.params.contactId);

        if (!contact) {
            return res.status(404).json({ success: false, message: "Contact not found" });
        }

        contact.name = req.body.name || contact.name;
        contact.phone = req.body.phone || contact.phone;
        contact.relation = req.body.relation || contact.relation;

        await user.save();
        res.status(200).json({ success: true, data: user.emergencyContacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a contact
// @route   DELETE /api/contacts/:contactId
exports.deleteContact = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.emergencyContacts = user.emergencyContacts.filter(
            (c) => c._id.toString() !== req.params.contactId
        );

        await user.save();
        res.status(200).json({ success: true, message: "Contact removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};