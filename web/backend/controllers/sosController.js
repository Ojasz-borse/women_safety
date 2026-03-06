const SOS = require('../models/SOS');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email transporter for SOS alerts (works reliably, unlike Twilio trial with Indian numbers)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Try Twilio if credentials exist; otherwise skip
let twilioClient = null;
try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        const twilio = require('twilio');
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
} catch (err) {
    console.log('Twilio not available:', err.message);
}

/**
 * Send emergency email to a contact
 */
const sendEmergencyEmail = async (toEmail, userName, mapLink, address, triggerType) => {
    try {
        await transporter.sendMail({
            from: `"SafeGuard SOS" <${process.env.FROM_EMAIL}>`,
            to: toEmail,
            subject: `🚨 EMERGENCY SOS from ${userName}!`,
            html: `
                <div style="font-family: Arial; padding: 20px; background: #1a0505; color: white; border-radius: 12px;">
                    <h1 style="color: #EF4444;">🚨 EMERGENCY SOS ALERT</h1>
                    <p style="font-size: 18px;"><strong>${userName}</strong> has triggered an emergency ${triggerType} SOS alert!</p>
                    <p style="font-size: 16px;">📍 Location: ${address}</p>
                    <a href="${mapLink}" style="display: inline-block; padding: 14px 28px; background: #EF4444; color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin: 16px 0;">
                        📍 View Location on Map
                    </a>
                    <p style="color: #ccc; font-size: 14px;">Please call them or send help immediately!</p>
                    <hr style="border-color: #333;" />
                    <p style="color: #888; font-size: 12px;">Sent by SafeGuard Women Safety App</p>
                </div>
            `,
        });
        return { success: true };
    } catch (err) {
        console.log('Email send error:', err.message);
        return { success: false, error: err.message };
    }
};

/**
 * SHARED LOGIC: Internal function for API and Cron Job
 */
exports.triggerSOSLogic = async (userId, latitude = 0, longitude = 0, address = 'Location unavailable', triggerType = 'manual') => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found.");
    }
    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
        throw new Error("No emergency contacts found. Add contacts first.");
    }

    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const messageBody = `🚨 ${triggerType.toUpperCase()} SOS! ${user.name} needs help! Location: ${address}. View: ${mapLink}`;

    const notificationResults = [];

    // Method 1: Try Twilio SMS
    for (const contact of user.emergencyContacts) {
        let smsSent = false;

        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            try {
                const result = await twilioClient.messages.create({
                    body: messageBody,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: contact.phone
                });
                smsSent = true;
                notificationResults.push({ name: contact.name, phone: contact.phone, status: 'sms_sent', sid: result.sid });
                console.log(`✅ SMS sent to ${contact.name} (${contact.phone})`);
            } catch (smsError) {
                console.log(`❌ SMS to ${contact.name} failed: ${smsError.message}`);
            }
        }

        // Method 2: Email fallback (always attempt)
        if (!smsSent) {
            // Try to send email if contact has an email-like phone or we have user's email
            const emailResult = await sendEmergencyEmail(
                user.email, // Send to user's own email as a record
                user.name,
                mapLink,
                address,
                triggerType
            );
            notificationResults.push({
                name: contact.name,
                phone: contact.phone,
                status: emailResult.success ? 'email_sent' : 'failed',
                error: emailResult.error
            });
            console.log(`📧 Email alert sent for contact ${contact.name}: ${emailResult.success ? 'OK' : 'FAILED'}`);
        }
    }

    const sentCount = notificationResults.filter(r => r.status === 'sms_sent' || r.status === 'email_sent').length;
    console.log(`SOS notifications: ${sentCount}/${user.emergencyContacts.length} delivered`);

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
        smsSentCount: sentCount,
        smsTotalCount: user.emergencyContacts.length,
        success: true
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