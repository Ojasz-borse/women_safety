const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['audio', 'video'],
        default: 'audio'
    },
    fileUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        default: 0
    },
    linkedSOS: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SOS'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Evidence', evidenceSchema);
