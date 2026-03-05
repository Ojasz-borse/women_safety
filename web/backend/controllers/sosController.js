const SOS = require('../models/SOS');
const User = require('../models/User');
const twilio = require('twilio');
const axios = require('axios');

// Initialize Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * SHARED LOGIC: Internal function for API and Cron Job
 */
exports.triggerSOSLogic = async (userId, latitude, longitude, address, triggerType = 'manual') => {
    const user = await User.findById(userId);
    if (!user || user.emergencyContacts.length === 0) {
        throw new Error("No emergency contacts found.");
    }

    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const messageBody = `🚨 ${triggerType.toUpperCase()} SOS! ${user.name} needs help! Location: ${address}. View: ${mapLink}`;

    // Send Real SMS via Twilio
    const smsPromises = user.emergencyContacts.map(contact => {
        return client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: contact.phone
        });
    });

    await Promise.all(smsPromises);

    // Create the Record in MongoDB
    return await SOS.create({
        user: userId,
        location: { latitude, longitude, address },
        triggerType,
        status: 'active',
        notifiedContacts: user.emergencyContacts.map(c => ({ name: c.name, phone: c.phone, status: 'sent' }))
    });
};

// --- ROUTE HANDLERS ---

exports.triggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const sosAlert = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'manual');
        res.status(201).json({ success: true, message: "Manual SOS Sent!", alertId: sosAlert._id });
    } catch (error) {
        res.status(500).json({ message: "SOS failed", error: error.message });
    }
};

exports.shakeTriggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const sosAlert = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'shake');
        res.status(201).json({ success: true, message: "Shake SOS Sent!", alertId: sosAlert._id });
    } catch (error) {
        res.status(500).json({ message: "Shake SOS failed", error: error.message });
    }
};

exports.voiceTriggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const sosAlert = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'voice');
        res.status(201).json({ success: true, message: "Voice SOS Sent!", alertId: sosAlert._id });
    } catch (error) {
        res.status(500).json({ message: "Voice SOS failed", error: error.message });
    }
};

exports.resolveSOS = async (req, res) => {
    try {
        const { alertId, note } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { status: 'resolved', resolutionNote: note }, { new: true });
        res.json({ success: true, message: "SOS Resolved", data: sos });
    } catch (error) {
        res.status(500).json({ message: "Failed to resolve SOS" });
    }
};

exports.cancelSOS = async (req, res) => {
    try {
        const { alertId } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { status: 'cancelled' }, { new: true });
        if (!sos) return res.status(404).json({ message: "Alert not found" });
        res.json({ success: true, message: "SOS Alert Cancelled successfully." });
    } catch (error) {
        res.status(500).json({ message: "Cancellation failed", error: error.message });
    }
};

exports.updateSOSLocation = async (req, res) => {
    try {
        const { alertId, latitude, longitude, address } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { location: { latitude, longitude, address } }, { new: true });
        res.json({ success: true, message: "Location updated", currentLocation: sos.location });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

exports.getSOSStatus = async (req, res) => {
    try {
        const alerts = await SOS.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ message: "Error fetching SOS status" });
    }
};

exports.getNearbyServices = async (req, res) => {
    try {
        const { lat, lng, type } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`;
        const response = await axios.get(url);
        res.json({ success: true, results: response.data.results });
    } catch (error) {
        res.status(500).json({ message: "Service lookup failed", error: error.message });
    }
};