require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const cron = require('node-cron');
const User = require('./models/User');
const { triggerSOSLogic } = require('./controllers/sosController');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const app = express();
connectDB();

app.use(cors());
app.use(express.json());
const sosRoutes = require('./routes/sosRoutes');
// Make the uploads folder publicly accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/timer', require('./routes/timerRoutes'));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/safe-places', require('./routes/safePlaceRoutes'));
const result = require('dotenv').config();
if (result.error) {
  console.log("❌ .env file not found!");
} else {
  console.log("✅ .env variables loaded:", Object.keys(result.parsed));
}
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

cron.schedule('* * * * *', async () => {
    const expiredUsers = await User.find({
        'safetyTimer.isActive': true,
        'safetyTimer.expiryTime': { $lte: new Date() }
    });

    for (let user of expiredUsers) {
        console.log(`⏰ Timer expired for ${user.name}. Triggering Auto-SOS!`);
        

        await triggerSOSLogic(user._id); 
        user.safetyTimer.isActive = false;
        await user.save();
    }
});