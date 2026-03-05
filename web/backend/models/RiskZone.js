// models/RiskZone.js
const mongoose = require('mongoose');

const riskZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'High' },
  // GeoJSON Polygon for the area boundary
  location: {
    type: { type: String, default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true } // Array of [lng, lat]
  }
});

riskZoneSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('RiskZone', riskZoneSchema);