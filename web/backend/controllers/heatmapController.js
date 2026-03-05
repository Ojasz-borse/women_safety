// controllers/heatmapController.js
exports.getHeatmapZones = async (req, res) => {
    try {
        const incidents = await Incident.find().select('location category');
        // The frontend (Google Maps/Mapbox) will take these points 
        // and render the visual "heat" intensity.
        res.json({ success: true, data: incidents });
    } catch (error) {
        res.status(500).json({ message: "Heatmap generation failed" });
    }
};