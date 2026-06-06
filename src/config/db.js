const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shinken', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB erreur:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
