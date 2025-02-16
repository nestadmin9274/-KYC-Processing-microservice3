const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const notifier = require('node-notifier');
require('dotenv').config();

const app = express();
const sequelize = require('./config/database');
const kycRoutes = require('./routes/kycRoutes');
const securityRoutes = require('./security/routes/securityRoutes');
const {
    rateLimiter,
    securityHeaders,
    xssProtection,
    hppProtection,
    corsProtection,
    requestSanitizer
} = require('./security/middleware/securityMiddleware');
const errorHandler = require('./security/middleware/errorHandler');
const { cors: corsConfig } = require('./security/config/securityConfig');
const { 
    iso27001Compliance, 
    soc2Compliance, 
    kycAmlCompliance 
} = require('./security/middleware/complianceMiddleware');

// Middleware
app.use(cors(corsConfig));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/security', securityRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Apply security middleware
app.use(securityHeaders);
app.use(rateLimiter);
app.use(xssProtection);
app.use(hppProtection);
app.use(corsProtection);
app.use(requestSanitizer);

// Apply compliance middleware
app.use(iso27001Compliance);
app.use(soc2Compliance);
app.use(kycAmlCompliance);

// Add error handler as the last middleware
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await sequelize.sync();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
    

    app.get('/health', (req, res) => {
      res.status(200).json({ message: 'Server is healthy' });
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
