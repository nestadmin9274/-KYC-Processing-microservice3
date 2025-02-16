const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { corsConfig } = require('../config/securityConfig');

const securityMiddleware = {
    // Rate limiting
    rateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        message: 'Too many requests from this IP, please try again later.'
    }),

    // Security headers using helmet
    securityHeaders: helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        xssFilter: true,
        noSniff: true,
        referrerPolicy: { policy: 'same-origin' }
    }),

    // XSS Protection
    xssProtection: xss(),

    // HTTP Parameter Pollution protection
    hppProtection: hpp(),

    // CORS configuration
    corsProtection: cors(corsConfig),

    // Request sanitization
    requestSanitizer: (req, res, next) => {
        // Sanitize request body
        if (req.body) {
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                }
            });
        }
        next();
    }
};

module.exports = securityMiddleware; 