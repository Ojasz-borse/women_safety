const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Send collaboration invite to another user
// @route   POST /api/collaboration/invite
exports.sendInvite = async (req, res) => {
    try {
        console.log("🤝 Collaboration invite request:", req.user.id, req.body);
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Find the user to invite
        const userToInvite = await User.findOne({ email: email.trim().toLowerCase() });
        if (!userToInvite) {
            return res.status(404).json({ success: false, message: "User not found with this email" });
        }

        // Check if same user
        if (userToInvite._id.toString() === req.user.id) {
            return res.status(400).json({ success: false, message: "Cannot collaborate with yourself" });
        }

        // Check if either user already has a collaborator
        if (req.user.collaborator) {
            return res.status(400).json({ success: false, message: "You already have a collaborator" });
        }
        if (userToInvite.collaborator) {
            return res.status(400).json({ success: false, message: "This user already has a collaborator" });
        }

        // Check if there's already a pending invite (from anyone)
        if (userToInvite.collaborationInvite && userToInvite.collaborationInvite.expiresAt > new Date()) {
            return res.status(400).json({ success: false, message: "This user already has a pending invite" });
        }

        // Send invite
        userToInvite.collaborationInvite = {
            from: req.user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        await userToInvite.save();
        console.log("✅ Invite saved to database");

        // Send email notification
        try {
            await sendEmail({
                to: email,
                subject: "🚨 Safety App Collaboration Invite",
                text: `${req.user.name} has invited you to collaborate on the Safety App. When you both accept, each other's emergency contacts will be synced and SOS alerts will be sent to both sets of contacts. Login to the app to accept the invite.`
            });
            console.log("📧 Email sent to:", email);
        } catch (emailErr) {
            console.log("📧 Email send failed (non-critical):", emailErr.message);
        }

        res.status(200).json({
            success: true,
            message: "Collaboration invite sent",
            data: { invitedUser: { id: userToInvite._id, name: userToInvite.name, email: userToInvite.email } }
        });
    } catch (error) {
        console.error("❌ Collaboration invite error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Accept collaboration invite
// @route   POST /api/collaboration/accept
exports.acceptInvite = async (req, res) => {
    try {
        console.log("🤝 Accept collaboration request:", req.user.id);
        const user = await User.findById(req.user.id);

        if (!user.collaborationInvite) {
            console.log("❌ No pending invite for user:", req.user.id);
            return res.status(400).json({ success: false, message: "No pending invite" });
        }

        // Check if invite is expired
        if (user.collaborationInvite.expiresAt < new Date()) {
            console.log("❌ Invite expired");
            user.collaborationInvite = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: "Invite has expired" });
        }

        // Get the user who sent the invite
        const inviter = await User.findById(user.collaborationInvite.from).select('-password');
        if (!inviter) {
            console.log("❌ Inviter not found");
            user.collaborationInvite = undefined;
            await user.save();
            return res.status(404).json({ success: false, message: "Inviting user not found" });
        }

        // Check if inviter still has no collaborator
        if (inviter.collaborator) {
            console.log("❌ Inviter already has collaborator");
            user.collaborationInvite = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: "This invite is no longer valid" });
        }

        // Link both users
        console.log("✅ Linking users:", user._id, "and", inviter._id);
        user.collaborator = inviter._id;
        user.collaborationInvite = undefined;
        await user.save();

        inviter.collaborator = user._id;
        await inviter.save();

        console.log("✅ Collaboration established!");
        res.status(200).json({
            success: true,
            message: "Collaboration accepted",
            data: { collaborator: { id: inviter._id, name: inviter.name, email: inviter.email, phoneNumber: inviter.phoneNumber } }
        });
    } catch (error) {
        console.error("❌ Accept collaboration error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Decline collaboration invite
// @route   POST /api/collaboration/decline
exports.declineInvite = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.collaborationInvite) {
            return res.status(400).json({ success: false, message: "No pending invite" });
        }

        user.collaborationInvite = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Invite declined" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove collaborator
// @route   DELETE /api/collaboration/remove
exports.removeCollaborator = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user.collaborator) {
            return res.status(400).json({ success: false, message: "No collaborator to remove" });
        }

        // Remove from both users
        await User.findByIdAndUpdate(user.collaborator, { collaborator: null });
        user.collaborator = null;
        await user.save();

        res.status(200).json({ success: true, message: "Collaborator removed" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get collaboration status
// @route   GET /api/collaboration/status
exports.getCollaborationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('collaborator', 'name email phoneNumber')
            .populate('collaborationInvite.from', 'name email');

        const hasInvite = !!user.collaborationInvite && user.collaborationInvite.expiresAt > new Date();
        
        console.log("📊 Collaboration status for", req.user.id, ":", {
            hasCollaborator: !!user.collaborator,
            hasPendingInvite: hasInvite
        });

        res.status(200).json({
            success: true,
            data: {
                hasCollaborator: !!user.collaborator,
                collaborator: user.collaborator,
                hasPendingInvite: hasInvite,
                inviteFrom: hasInvite ? user.collaborationInvite.from : null
            }
        });
    } catch (error) {
        console.error("❌ Get collaboration status error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get merged emergency contacts (user + collaborator)
// @route   GET /api/collaboration/contacts
exports.getMergedContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('collaborator', 'name email emergencyContacts');

        const myContacts = user.emergencyContacts || [];
        const collaboratorContacts = user.collaborator ? (user.collaborator.emergencyContacts || []) : [];

        // Merge contacts (remove duplicates by phone number)
        const allContacts = [...myContacts];
        collaboratorContacts.forEach(contact => {
            const exists = allContacts.find(c => c.phone === contact.phone);
            if (!exists) {
                allContacts.push(contact);
            }
        });

        res.status(200).json({
            success: true,
            data: {
                myContacts,
                collaboratorContacts: user.collaborator ? collaboratorContacts : [],
                mergedContacts: allContacts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
