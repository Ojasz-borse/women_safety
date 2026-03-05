const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: { 
        type: Number, 
        required: true },
    longitude: {  
        type: Number,
         required: true },
    address: { 
        type: String 
    }
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  triggerType: { 
    type: String, 
    enum: ['manual', 'shake', 'timer'], 
    default: 'manual' 
  },
  notifiedContacts: [{
    name: String,
    phone: String,
    status: { type: String, default: 'sent' }
  }],
  triggeredAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);