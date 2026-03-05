const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { 
        type: String, 
        enum: ['Harassment', 'Stalking', 'Unsafe Area', 'Assault'], 
        required: true 
    },
    description: String,
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    reportedAt: { type: Date, default: Date.now }
});

incidentSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Incident', incidentSchema);