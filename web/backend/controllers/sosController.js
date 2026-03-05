const SOS = require('../models/SOS');
const User = require('../models/User');
const twilio = require('twilio');

// Initialize Twilio
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const user = await User.findById(req.user.id);

    if (user.emergencyContacts.length === 0) {
      return res.status(400).json({ message: "No emergency contacts found." });
    }

    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const messageBody = `🚨 EMERGENCY! ${user.name} needs help! Location: ${address}. View on Maps: ${mapLink}`;

    // SEND REAL SMS TO EACH CONTACT
    const smsPromises = user.emergencyContacts.map(contact => {
      return client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone // Ensure phone numbers include country code (e.g., +91)
      });
    });

    await Promise.all(smsPromises);

    const sosAlert = await SOS.create({
      user: req.user.id,
      location: { latitude, longitude, address },
      notifiedContacts: user.emergencyContacts.map(c => ({ name: c.name, phone: c.phone, status: 'sent' }))
    });

    res.status(201).json({
      success: true,
      message: `REAL SMS sent to ${user.emergencyContacts.length} contacts!`,
      alertId: sosAlert._id
    });
  } catch (error) {
    res.status(500).json({ message: "SMS failed to send", error: error.message });
  }
};
exports.triggerSOS = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const user = await User.findById(req.user.id);

    if (user.emergencyContacts.length === 0) {
      return res.status(400).json({ message: "No emergency contacts found. Please add some first!" });
    }

    const sosAlert = await SOS.create({
      user: req.user.id,
      location: { latitude, longitude, address },
      notifiedContacts: user.emergencyContacts.map(c => ({ name: c.name, phone: c.phone }))
    });

    // LOGIC: This is where you would call an SMS API (like Twilio) 
    // to send the location link to all user.emergencyContacts.
    console.log(`🚨 SOS Sent to: ${user.emergencyContacts.map(c => c.name).join(', ')}`);

    res.status(201).json({
      success: true,
      message: `SOS Activated! Alerts sent to ${user.emergencyContacts.length} contacts.`,
      alertId: sosAlert._id
    });
  } catch (error) {
    res.status(500).json({ message: "SOS Trigger Failed", error: error.message });
  }
};
exports.getSOSStatus = async (req, res) => {
  try {
    // Finds the most recent SOS alert for this user
    const alerts = await SOS.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Newest first
      .limit(10); // Show last 10 emergencies

    if (!alerts || alerts.length === 0) {
      return res.status(404).json({ message: "No SOS history found." });
    }

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching SOS status", error: error.message });
  }
};
// @desc    Broadcast SOS to external services (SMS/Email)
// @route   POST /api/sos/send-alert
exports.sendAlert = async (req, res) => {
  try {
    const { alertId } = req.body;
    const sos = await SOS.findById(alertId).populate('user', 'name phoneNumber');

    if (!sos) return res.status(404).json({ message: "Alert not found" });

    // Generate a Google Maps link
    const mapLink = `https://www.google.com/maps?q=${sos.location.latitude},${sos.location.longitude}`;
    const message = `🚨 EMERGENCY! ${sos.user.name} needs help! Location: ${mapLink}`;

    // --- INTEGRATION POINT ---
    // Here is where you would call Twilio or Nodemailer
    // Example console log for now:
    console.log(`Sending SMS to contacts: ${message}`);

    res.json({ 
      success: true, 
      message: "Emergency broadcast sent to all contacts.",
      broadcastContent: message 
    });
  } catch (error) {
    res.status(500).json({ message: "Broadcast failed" });
  }
};
// @desc    Update live location during active SOS
// @route   PUT /api/sos/update-location
exports.updateSOSLocation = async (req, res) => {
  try {
    const { alertId, latitude, longitude, address } = req.body;

    const sos = await SOS.findById(alertId);
    if (!sos) return res.status(404).json({ message: "SOS Alert not found" });
    if (sos.status !== 'active') return res.status(400).json({ message: "Alert is no longer active" });

    // Update the current location
    sos.location = { latitude, longitude, address };
    
    // Optional: Keep a history of the path (if you add a 'path' array to your Model)
    // sos.path.push({ latitude, longitude, timestamp: Date.now() });

    await sos.save();

    res.json({
      success: true,
      message: "Location updated successfully",
      currentLocation: sos.location
    });
  } catch (error) {
    res.status(500).json({ message: "Location update failed", error: error.message });
  }
};
// @desc    Resolve/End SOS Alert
// @route   POST /api/sos/resolve
exports.resolveSOS = async (req, res) => {
  try {
    const { alertId, note } = req.body; // User can add a note like "I am home safe"
    
    const sos = await SOS.findByIdAndUpdate(
      alertId, 
      { status: 'resolved', resolutionNote: note }, 
      { new: true }
    );

    res.json({ 
      success: true, 
      message: "SOS Resolved. Status updated to safe.",
      data: sos 
    });
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
}