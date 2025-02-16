const rateLimit = require('express-rate-limit');
const { rateLimit: rateLimitConfig } = require('../config/securityConfig');

const rateLimiter = rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: {
        status: 429,
        message: 'Too many requests, please try again later.'
    }
});

module.exports = rateLimiter; 