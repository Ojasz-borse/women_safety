// Migration script to add collaboration fields to existing users
require('dotenv').config();
const mongoose = require('mongoose');

console.log("🚀 Starting collaboration migration...");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const User = require('./models/User');

async function migrate() {
  try {
    // Update all users to ensure they have the new fields
    const result = await User.updateMany(
      { 
        $or: [
          { collaborator: { $exists: false } },
          { collaborationInvite: { $exists: false } }
        ]
      },
      { 
        $set: { 
          collaborator: null,
          collaborationInvite: undefined
        } 
      }
    );

    console.log(`✅ Migration complete! Modified ${result.modifiedCount} users`);
    
    // Show sample user to verify
    const sampleUser = await User.findOne().select('name email collaborator collaborationInvite');
    console.log("Sample user:", sampleUser);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

migrate();
