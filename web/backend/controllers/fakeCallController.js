// controllers/fakeCallController.js

exports.scheduleFakeCall = async (req, res) => {
    try {
        const { callerName, delaySeconds } = req.body;

        // In a real app, you'd use Firebase Cloud Messaging (FCM) here
        // For your backend logic, we calculate the scheduled time
        const scheduledTime = new Date(Date.now() + delaySeconds * 1000);

        res.status(200).json({
            success: true,
            message: `Fake call from ${callerName || 'Home'} scheduled in ${delaySeconds} seconds.`,
            scheduledTime: scheduledTime
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to schedule fake call", error: error.message });
    }
};
