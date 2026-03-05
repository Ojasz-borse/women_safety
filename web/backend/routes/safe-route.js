// @desc Check if a suggested route is safe
// @route POST /api/routes/safe-route
exports.checkRouteSafety = async (req, res) => {
    try {
        const { routeCoordinates } = req.body; // Array of [lng, lat]

        // Check if any point in the route falls inside a High-Risk Zone
        const riskyZonesIntersected = await RiskZone.find({
            location: {
                $geoIntersects: {
                    $geometry: {
                        type: "LineString",
                        coordinates: routeCoordinates
                    }
                }
            }
        });

        const isSafe = riskyZonesIntersected.length === 0;

        res.json({
            success: true,
            isSafe: isSafe,
            riskCount: riskyZonesIntersected.length,
            message: isSafe ? "Route is safe." : "Route passes through high-risk areas."
        });
    } catch (error) {
        res.status(500).json({ message: "Safety check failed", error: error.message });
    }
};