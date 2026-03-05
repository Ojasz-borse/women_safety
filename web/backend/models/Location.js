const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coordinates: {
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 }
  },
  isSharing: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Location', locationSchema);