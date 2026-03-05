const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};


exports.register = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      email,
      password,
      address,
      bloodGroup,
      profilePhoto,
    } = req.body;

    if (!name || !phoneNumber || !email || !password || !address) {
      return res
        .status(400)
        .json({ message: "Please add all required fields" });
    }


    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phoneNumber,
      email,
      password: hashedPassword,
      address,
      bloodGroup,
      profilePhoto,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data received" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp || !user.otpExpire) {
      return res.status(400).json({ message: 'Invalid request or OTP not requested' });
    }

    if (user.otpExpire < Date.now()) {
      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const otp = Math.floor(100000 + Math.random() * 900000).toString();


    const salt = await bcrypt.genSalt(10);
    user.otp = await bcrypt.hash(otp, salt);
    user.otpExpire = Date.now() + 10 * 60 * 1000; 
    await user.save();


    const message = `Your verification OTP is: ${otp}. It is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your Verification OTP',
        message: message
      });

      res.status(200).json({ message: 'OTP sent successfully to email' });
    } catch (error) {

      user.otp = undefined;
      user.otpExpire = undefined;
      await user.save();
      
      return res.status(500).json({ message: 'Email could not be sent', error: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();


    const resetUrl = `http://localhost:${process.env.PORT || 5000}/api/auth/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) requested a password reset. \n\nPlease make a POST/PUT request to the following link to reset your password: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: message
      });

      res.status(200).json({ message: 'Password reset link sent to email' });
    } catch (error) {

      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: 'Email could not be sent', error: error.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body; // Check if this name matches Postman

        if (!password) {
            return res.status(400).json({ message: "Please provide a new password" });
        }

        // The error happens here if 'password' is undefined
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ... rest of your update logic
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
