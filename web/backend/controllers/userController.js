const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get logged in user profile

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        // Update all allowed fields
        if (req.body.name) user.name = req.body.name;
        if (req.body.phoneNumber) user.phoneNumber = req.body.phoneNumber;
        if (req.body.bloodGroup) user.bloodGroup = req.body.bloodGroup;
        if (req.body.address) user.address = req.body.address;
        if (req.file) user.profilePhoto = `/uploads/${req.file.filename}`;
        
        await user.save();
        res.json({ 
            success: true,
            message: "Profile updated successfully",
            user 
        });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        res.json({ message: "User deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addContact = async (req, res) => {
  try {
    const { name, phone, relation } = req.body;
    const user = await User.findById(req.user.id);

    // Limit to 5 contacts for safety/spam reasons
    if (user.emergencyContacts.length >= 5) {
      return res.status(400).json({ message: "Maximum 5 contacts allowed" });
    }

    user.emergencyContacts.push({ name, phone, relation });
    await user.save();

    res.status(201).json({ 
      message: "Contact added successfully", 
      contacts: user.emergencyContacts 
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding contact", error: error.message });
  }
};


exports.deleteContact = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.emergencyContacts = user.emergencyContacts.filter(
      (contact) => contact._id.toString() !== req.params.contactId
    );
    await user.save();
    res.json({ message: "Contact removed", contacts: user.emergencyContacts });
  } catch (error) {
    res.status(500).json({ message: "Error removing contact" });
  }
};
