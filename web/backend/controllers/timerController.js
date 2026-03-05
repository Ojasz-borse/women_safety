const User = require('../models/User');

exports.startTimer = async (req, res) => {
    try {
        const { minutes } = req.body;
        // Calculate the exact time the timer should expire
        const expiry = new Date(Date.now() + minutes * 60000);

        await User.findByIdAndUpdate(req.user.id, {
            safetyTimer: {
                isActive: true,
                expiryTime: expiry,
                duration: minutes
            }
        });

        res.json({ 
            success: true, 
            message: `Safety timer set for ${minutes} minutes.`,
            expiresAt: expiry 
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to start timer", error: error.message });
    }
};

exports.stopTimer = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            'safetyTimer.isActive': false
        });
        res.json({ success: true, message: "Timer stopped. You are marked safe!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to stop timer" });
    }
};