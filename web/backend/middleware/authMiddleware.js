const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verify JWT token
 * Middleware to authenticate requests
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from decoded token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      // Check if user still exists
      if (!req.user) {
        return res.status(401).json({ message: 'User not found, token may be invalid' });
      }

      // Proceed to next middleware/route
      return next();
    } catch (error) {
      console.error("JWT Verification Error:", error.message);

      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired, please login again' });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format' });
      }

      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // No token provided
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  // Authorization header doesn't start with Bearer
  return res.status(401).json({ message: 'Invalid authorization header format' });
};

/**
 * Admin middleware - Check if user has admin role
 * Must be used after protect middleware
 */
const admin = (req, res, next) => {
  // Check if user exists and has admin role
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ 
    message: 'Access denied. Admin privileges required.' 
  });
};

/**
 * Optional auth middleware - Authenticate if token exists, but don't require it
 * Useful for routes that show different content for logged-in vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore errors for optional auth
      console.log("Optional auth - no valid token provided");
    }
  }

  return next();
};

module.exports = { protect, admin, optionalAuth };