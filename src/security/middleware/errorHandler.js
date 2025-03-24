const AuditLog = require('../models/AuditLog');

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
            user_agent: req.headers['user-agent'],
            severity: 'CRITICAL',
            timestamp: new Date()
        });
    }

    // Send error response
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'An error occurred' 
            : err.message
    });
};

module.exports = errorHandler; 