const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const notifier = require('node-notifier');
require('dotenv').config();

const app = express();
const sequelize = require('./config/database');
const kycRoutes = require('./routes/kycRoutes');
const healthRoute = require("./routes/health.routes");

// Import security middleware
const {
    rateLimiter,
    securityHeaders,
    xssProtection,
    hppProtection,
    corsProtection,
    requestSanitizer,
    iso27001Compliance,
    soc2Compliance,
    kycAmlCompliance,
    errorHandler,
    auditLogger
} = require('./security/middleware');


// Basic middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply security middleware in correct order
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

// Apply audit logging to all routes
app.use((req, res, next) => {
    // Skip audit logging for health check and static files
    if (req.path === '/health' || req.path.startsWith('/uploads/')) {
        return next();
    }

    // Log the request
    auditLogger.log(req.user?.id, req.method, {
        path: req.path,
        body: req.method !== 'GET' ? req.body : undefined,
        params: req.params,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        severity: 'INFO' // Add severity for request logs
    });

    // Log response
    const originalSend = res.send;
    res.send = function(data) {
        auditLogger.log(req.user?.id, `${req.method}_RESPONSE`, {
            path: req.path,
            statusCode: res.statusCode,
            responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
            severity: res.statusCode >= 400 ? 'ERROR' : 'INFO' // Add severity based on status code
        });
        return originalSend.apply(res, arguments);
    };

    next();
});

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/health', healthRoute);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Add error handler as the last middleware
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // In production, only sync if tables don't exist
        // In development, force sync to recreate tables
        const syncOptions = process.env.NODE_ENV === 'production' 
            ? { alter: false } // Don't alter tables in production
            : { force: true }; // Force sync in development
            
        await sequelize.sync(syncOptions);
        console.log('✅ Database connected successfully');

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
        });

        // Send a desktop notification
        notifier.notify({
            title: 'KYC Microservice',
            message: `Server started on port ${PORT}`,
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1); // Exit if database connection fails
    }
}

startServer();
