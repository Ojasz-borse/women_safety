// controllers/locationController.js

const Location = require('../models/Location'); 

// @desc Start Sharing Location
// @desc Start Sharing Location
exports.startSharing = async (req, res) => {
    try {
        await Location.findOneAndUpdate(
            { user: req.user.id },
            { isSharing: true, lastUpdated: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ success: true, message: "Live location sharing started." });
    } catch (error) {
        res.status(500).json({ message: "Error starting location sharing", error: error.message });
    }
};
// @desc Start Sharing Location
// @route POST /api/location/start-sharing
exports.startSharing = async (req, res) => {
    await Location.findOneAndUpdate(
        { user: req.user.id },
        { isSharing: true, lastUpdated: Date.now() },
        { upsert: true }
    );
    res.json({ success: true, message: "Live location sharing started." });
};

// @desc Stop Sharing Location
// @route POST /api/location/stop-sharing
// @desc Get a specific user's live location
// @route GET /api/location/:userId
exports.getUserLocation = async (req, res) => {
    try {
        // Find the location record for the requested user
        const location = await Location.findOne({ user: req.params.userId });

        if (!location) {
            return res.status(404).json({ message: "Location data not found for this user." });
        }

        // Security Check: Only return data if the user is currently sharing
        if (!location.isSharing) {
            return res.status(403).json({ 
                success: false, 
                message: "This user is not currently sharing their live location." 
            });
        }

        res.json({
            success: true,
            data: {
                coordinates: location.coordinates,
                lastUpdated: location.lastUpdated
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
exports.stopSharing = async (req, res) => {
    await Location.findOneAndUpdate({ user: req.user.id }, { isSharing: false });
    res.json({ success: true, message: "Location sharing stopped." });
};
// @desc Update Current Location
// @route POST /api/location/update
exports.updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        
        // Find by user ID and update coordinates
        const location = await Location.findOneAndUpdate(
            { user: req.user.id },
            { 
                coordinates: { latitude, longitude },
                lastUpdated: Date.now() 
            },
            { new: true, upsert: true } // Create if it doesn't exist
        );

        res.json({ 
            success: true, 
            message: "Location updated successfully",
            data: location.coordinates 
        });
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

// @desc Get a User's Live Location (For Contacts)
// @route GET /api/location/:userId
exports.getUserLocation = async (req, res) => {
    const location = await Location.findOne({ user: req.params.userId });
    
    if (!location || !location.isSharing) {
        return res.status(403).json({ message: "User is not currently sharing location." });
    }
    
    res.json({ success: true, data: location });
};