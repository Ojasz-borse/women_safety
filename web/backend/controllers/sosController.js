const SOS = require('../models/SOS');
const User = require('../models/User');
const axios = require('axios');

// Use Fast2SMS for direct SMS to Indian numbers (more reliable than Twilio for India)
const sendSMS = async (phone, message) => {
    try {
        // Fast2SMS API (works reliably in India)
        const apiKey = process.env.FAST2SMS_API_KEY;
        
        if (!apiKey) {
            console.log("⚠️ Fast2SMS API key not configured");
            return { success: false, error: "No API key" };
        }

        // Clean phone number (remove +91 or 0 prefix if needed)
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.startsWith('+91')) cleanPhone = cleanPhone.substring(3);
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                route: 'q',
                message: message,
                key: apiKey,
                numbers: cleanPhone
            }
        });

        console.log(`✅ Fast2SMS response:`, response.data);
        return { success: true, response: response.data };
    } catch (error) {
        console.error(`❌ Fast2SMS error:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * SHARED LOGIC: Internal function for API and Cron Job
 * If includeCollaborator is true, also sends to collaborator's contacts
 */
exports.triggerSOSLogic = async (userId, latitude = 0, longitude = 0, address = 'Location unavailable', triggerType = 'manual', includeCollaborator = true) => {
    console.log("🚨 SOS Trigger Logic started for user:", userId);
    const user = await User.findById(userId).populate('collaborator', 'name email emergencyContacts');
    if (!user) {
        throw new Error("User not found.");
    }
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
        throw new Error("No emergency contacts found. Add contacts first.");
    }

    // Get merged contacts (user + collaborator if exists)
    let allContacts = [...user.emergencyContacts];
    let hasCollaborator = false;

    if (includeCollaborator && user.collaborator && user.collaborator.emergencyContacts && user.collaborator.emergencyContacts.length > 0) {
        hasCollaborator = true;
        console.log("🤝 Collaborator found! Merging contacts...");
        // Add collaborator's contacts (avoid duplicates by phone)
        user.collaborator.emergencyContacts.forEach(contact => {
            const exists = allContacts.find(c => c.phone === contact.phone);
            if (!exists) {
                allContacts.push(contact);
            }
        });
        console.log(`Merged contacts: ${user.emergencyContacts.length} (user) + ${user.collaborator.emergencyContacts.length} (collaborator) = ${allContacts.length} total`);
    } else {
        console.log("ℹ️ No collaborator or collaborator has no contacts");
    }

    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const messageBody = `🚨 SOS ALERT! ${user.name} needs urgent help! Location: ${address}. View map: ${mapLink} - SafeGuard App`;

    const notificationResults = [];
    let smsSentCount = 0;

    // Send SMS to ALL contacts directly
    console.log(`📱 Sending SMS to ${allContacts.length} contacts...`);
    
    for (const contact of allContacts) {
        try {
            const smsResult = await sendSMS(contact.phone, messageBody);
            
            if (smsResult.success) {
                smsSentCount++;
                notificationResults.push({ 
                    name: contact.name, 
                    phone: contact.phone, 
                    status: 'sms_sent'
                });
                console.log(`✅ SMS sent to ${contact.name} (${contact.phone})`);
            } else {
                notificationResults.push({ 
                    name: contact.name, 
                    phone: contact.phone, 
                    status: 'sms_failed',
                    error: smsResult.error
                });
                console.log(`❌ SMS failed to ${contact.name} (${contact.phone})`);
            }
        } catch (error) {
            notificationResults.push({ 
                name: contact.name, 
                phone: contact.phone, 
                status: 'error',
                error: error.message
            });
            console.error(`❌ SMS error to ${contact.name}:`, error.message);
        }
    }

    console.log(`📊 SOS SMS Summary: ${smsSentCount}/${allContacts.length} sent successfully`);

    // Always create the SOS record
    const sosAlert = await SOS.create({
        user: userId,
        location: { latitude, longitude, address },
        triggerType,
        status: 'active',
        notifiedContacts: notificationResults
    });

    return {
        _id: sosAlert._id,
        alertId: sosAlert._id,
        smsSentCount: smsSentCount,
        smsTotalCount: allContacts.length,
        success: true,
        hasCollaborator
    };
};

// --- ROUTE HANDLERS ---

exports.triggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const result = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'manual');
        res.status(201).json({ success: true, message: "SOS Sent!", alertId: result.alertId, smsSentCount: result.smsSentCount, smsTotalCount: result.smsTotalCount });
    } catch (error) {
        console.log('SOS trigger error:', error.message);
        res.status(500).json({ success: false, message: "SOS failed", error: error.message });
    }
};

exports.shakeTriggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const result = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'shake');
        res.status(201).json({ success: true, message: "Shake SOS Sent!", alertId: result.alertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Shake SOS failed", error: error.message });
    }
};

exports.voiceTriggerSOS = async (req, res) => {
    try {
        const { latitude, longitude, address } = req.body;
        const result = await exports.triggerSOSLogic(req.user.id, latitude, longitude, address, 'voice');
        res.status(201).json({ success: true, message: "Voice SOS Sent!", alertId: result.alertId });
    } catch (error) {
        res.status(500).json({ success: false, message: "Voice SOS failed", error: error.message });
    }
};

exports.resolveSOS = async (req, res) => {
    try {
        const { alertId, note } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { status: 'resolved', resolutionNote: note }, { new: true });
        res.json({ success: true, message: "SOS Resolved", data: sos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to resolve SOS" });
    }
};

exports.cancelSOS = async (req, res) => {
    try {
        const { alertId } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { status: 'cancelled' }, { new: true });
        if (!sos) return res.status(404).json({ success: false, message: "Alert not found" });
        res.json({ success: true, message: "SOS Alert Cancelled successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Cancellation failed", error: error.message });
    }
};

exports.updateSOSLocation = async (req, res) => {
    try {
        const { alertId, latitude, longitude, address } = req.body;
        const sos = await SOS.findByIdAndUpdate(alertId, { location: { latitude, longitude, address } }, { new: true });
        res.json({ success: true, message: "Location updated", currentLocation: sos ? sos.location : null });
    } catch (error) {
        res.status(500).json({ success: false, message: "Update failed" });
    }
};

exports.getSOSStatus = async (req, res) => {
    try {
        const alerts = await SOS.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching SOS status" });
    }
};

exports.getNearbyServices = async (req, res) => {
    try {
        const { lat, lng, type } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return res.status(400).json({ success: false, message: "Google Maps API key not configured" });
        }
        const axios = require('axios');
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${type}&key=${apiKey}`;
        const response = await axios.get(url);
        res.json({ success: true, results: response.data.results });
    } catch (error) {
        res.status(500).json({ success: false, message: "Service lookup failed", error: error.message });
    }
};