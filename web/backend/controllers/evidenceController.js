const Evidence = require('../models/Evidence');
const path = require('path');

// @desc    Upload evidence recording
// @route   POST /api/evidence/upload
exports.uploadEvidence = async (req, res) => {
    try {
        console.log("=== Evidence Upload Request ===");
        console.log("User:", req.user);
        console.log("Body:", req.body);
        console.log("File:", req.file);
        
        if (!req.user) {
            console.log("❌ No user in request - authentication failed");
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!req.file) {
            console.log("❌ No file uploaded");
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { type, duration, linkedSOS, notes } = req.body;

        const evidence = await Evidence.create({
            user: req.user.id,
            type: type || 'audio',
            fileUrl: `/uploads/evidence/${req.file.filename}`,
            duration: duration || 0,
            linkedSOS: linkedSOS || undefined,
            notes: notes || ''
        });

        console.log("✅ Evidence saved:", evidence._id);
        res.status(201).json({
            success: true,
            data: evidence
        });
    } catch (error) {
        console.error("❌ Upload error:", error.message);
        console.error("Stack:", error.stack);
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
};

// @desc    Get user's evidence recordings
// @route   GET /api/evidence/list
exports.getEvidenceList = async (req, res) => {
    try {
        const evidence = await Evidence.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate('linkedSOS', 'status createdAt');

        res.json({
            success: true,
            count: evidence.length,
            data: evidence
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch evidence", error: error.message });
    }
};

// @desc    Delete evidence recording
// @route   DELETE /api/evidence/:id
exports.deleteEvidence = async (req, res) => {
    try {
        const evidence = await Evidence.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!evidence) {
            return res.status(404).json({ message: "Evidence not found" });
        }

        res.json({ success: true, message: "Evidence deleted" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
};
