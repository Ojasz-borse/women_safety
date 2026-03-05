const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    bloodGroup: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    // --- OTP & Verification ---
    otp: { 
        type: String
    },
    otpExpire: {
         type: Date 
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // --- Password Reset ---
    resetPasswordToken: { 
        type: String
    },
    resetPasswordExpire: {
         type: Date 
    },

safetyTimer: {
    isActive: { type: Boolean, default: false },
    expiryTime: { type: Date },
    timerDuration: { type: Number } 
},safetyTimer: {
    isActive: { type: Boolean, default: false },
    expiryTime: { type: Date },
    duration: { type: Number } // Minutes
},

    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relation: { type: String } 
      }
    ],
  },
  
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("User", userSchema);