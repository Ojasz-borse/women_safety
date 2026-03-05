const Incident = require('../models/Incident');

// @desc    Report an incident
exports.reportIncident = async (req, res) => {
    try {
        const { category, description, longitude, latitude } = req.body;
        const incident = await Incident.create({
            reporter: req.user.id,
            category,
            description,
            location: { type: 'Point', coordinates: [longitude, latitude] }
        });
        res.status(201).json({ success: true, data: incident });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get heatmap data (all reports)
exports.getHeatmapData = async (req, res) => {
    try {
        const incidents = await Incident.find().select('location category reportedAt');
        res.status(200).json({ success: true, count: incidents.length, data: incidents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};