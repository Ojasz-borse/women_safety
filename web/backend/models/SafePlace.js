const mongoose = require("mongoose");

const safePlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["Police", "Hospital", "Shelter"],
    required: true,
  },
  address: { type: String },
  phone: { type: String },

  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], required: true },
  },
});

safePlaceSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("SafePlace", safePlaceSchema);
