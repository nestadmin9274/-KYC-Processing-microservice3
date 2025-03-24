const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const securityConfig = require('../config/securityConfig');
const complianceConfig = require('../config/complianceConfig');
const AuditLog = require('../models/AuditLog');
const { sanitizeInput } = require('../utils/sanitizer');

// Rate limiting
const rateLimiter = rateLimit({
    windowMs: securityConfig.rateLimit.windowMs,
    max: securityConfig.rateLimit.max,
    message: securityConfig.rateLimit.message
});

// Security headers
const securityHeaders = helmet({
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
});

// XSS Protection
const xssProtection = xss();

// HTTP Parameter Pollution protection
const hppProtection = hpp();

// CORS configuration
const corsProtection = cors(securityConfig.cors);

// Request sanitization
const requestSanitizer = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    
    next();
};

// ISO 27001 Compliance
const iso27001Compliance = (req, res, next) => {
    // Skip compliance checks for public routes
    if (req.path === '/health' || req.path === '/api/auth/login') {
        return next();
    }

    const { accessControl } = complianceConfig.iso27001;
    
    // Check session timeout
    if (req.session && req.session.lastActivity) {
        const timeSinceLastActivity = Date.now() - req.session.lastActivity;
        if (timeSinceLastActivity > accessControl.sessionTimeout) {
            return res.status(440).json({ message: 'Session expired' });
        }
    }
    
    // Update last activity
    if (req.session) {
        req.session.lastActivity = Date.now();
    }
    
    next();
};

// SOC2 Compliance
const soc2Compliance = async (req, res, next) => {
    try {
        // Skip audit logging for health check and public routes
        if (req.path === '/health' || req.path === '/api/auth/login') {
            return next();
        }

        const { monitoring } = complianceConfig.soc2;
        
        // Log access for audit trail
        if (monitoring.auditTrail.enabled) {
            await AuditLog.create({
                user_id: req.user?.id || null,
                action: req.method,
                request_details: {
                    path: req.path,
                    body: req.method !== 'GET' ? req.body : undefined,
                    params: Object.keys(req.params).length ? req.params : undefined
                },
                ip_address: req.ip || 'unknown',
                user_agent: req.headers['user-agent']
            });
        }
        
        next();
    } catch (error) {
        console.error('SOC2 Compliance Error:', error);
        // Don't block the request if audit logging fails
        next();
    }
};

// KYC/AML Compliance
const kycAmlCompliance = async (req, res, next) => {
    try {
        // Skip KYC/AML checks for non-KYC routes
        if (!req.path.includes('/kyc')) {
            return next();
        }

        const { documentRequirements } = complianceConfig.rbiKyc;
        
        // Check for mandatory documents
        if (req.body.documentType) {
            const isValidDocument = documentRequirements.mandatory
                .includes(req.body.documentType);
            
            if (!isValidDocument) {
                return res.status(400).json({
                    message: 'Invalid or insufficient KYC document'
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('KYC/AML Compliance Error:', error);
        next(error);
    }
};

// Error handler
const errorHandler = async (err, req, res, next) => {
    // Log error
    console.error(err.stack);

    // Log security-related errors to audit log
    if (err.name === 'UnauthorizedError' || err.name === 'ForbiddenError') {
        await AuditLog.create({
            user_id: req.user?.id || null,
            action: 'SECURITY_ERROR',
            request_details: {
                error: err.message,
                path: req.path,
                method: req.method
            },
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });
    }

    // Send error response
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'An error occurred' 
            : err.message
    });
};

module.exports = {
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
    auditLogger: require('../utils/auditLogger')
}; 