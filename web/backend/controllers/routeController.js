// controllers/routeController.js
const RiskZone = require('../models/RiskZone');
const axios = require('axios');

exports.getHighRiskZones = async (req, res) => {
    try {
        const zones = await RiskZone.find();
        res.json({ success: true, data: zones });
    } catch (error) {
        res.status(500).json({ message: "Error fetching zones", error: error.message });
    }
};

// Proxy Google Directions API
exports.getDirections = async (req, res) => {
    try {
        const { origin, destination } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Google Maps API key not configured" });
        }
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=walking&key=${apiKey}`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Directions failed", error: error.message });
    }
};

// Check if route is safe
exports.getSafeRoute = async (req, res) => {
    try {
        const { origin, destination } = req.body;
        // Check nearby risk zones
        const zones = await RiskZone.find();
        const [oLat, oLng] = origin.split(',').map(Number);
        const [dLat, dLng] = destination.split(',').map(Number);

        let isSafe = true;
        for (const zone of zones) {
            if (zone.riskLevel === 'high') {
                // Simple proximity check
                if (zone.area && zone.area.coordinates) {
                    isSafe = false;
                    break;
                }
            }
        }
        res.json({ success: true, isSafe, riskCount: zones.length });
    } catch (error) {
        res.status(500).json({ message: "Safety check failed", error: error.message });
    }
};