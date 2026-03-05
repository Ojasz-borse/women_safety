// controllers/routeController.js
const RiskZone = require('../models/RiskZone');

exports.getHighRiskZones = async (req, res) => {
    try {
        const zones = await RiskZone.find();
        res.json({ success: true, data: zones });
    } catch (error) {
        res.status(500).json({ message: "Error fetching zones", error: error.message });
    }
};