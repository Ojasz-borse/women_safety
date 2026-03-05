const SafePlace = require('../models/SafePlace');

exports.getNearbyHelp = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({ message: "Location coordinates are required" });
    }

    const nearbyPlaces = await SafePlace.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 5000 // 5000 meters = 5km
        }
      }
    }).limit(5);

    res.json({
      success: true,
      count: nearbyPlaces.length,
      data: nearbyPlaces
    });
  } catch (error) {
    res.status(500).json({ message: "Error finding safe places", error: error.message });
  }
};