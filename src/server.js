const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const notifier = require('node-notifier');
require('dotenv').config();

const app = express();
const sequelize = require('./config/database');
const kycRoutes = require('./routes/kycRoutes');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/kyc', kycRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Database connection and server start
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await sequelize.sync();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
    

      // Send an HTTP request to the server itself
      try {
        const response = await axios.get(`http://localhost:${PORT}/health`);
        console.log('✅ Server health check:', response.data.message);
      } catch (error) {
        console.error('⚠️ Unable to reach localhost:', error.message);
      }

      // Send a desktop notification
      notifier.notify({
        title: 'KYC Microservice',
        message: `Server started on port ${PORT}`,
      });
    
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();
