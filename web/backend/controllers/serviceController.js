const axios = require('axios');


exports.getNearbyServices = async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; 
        const { type } = req.params; 

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: "Location is required" });
        }


        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_MAPS_API_KEY}`;

        const response = await axios.get(url);
        
        res.status(200).json({
            success: true,
            count: response.data.results.length,
            data: response.data.results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};