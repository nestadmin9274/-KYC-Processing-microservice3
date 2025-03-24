const AuditLog = require('../models/AuditLog');
const xss = require('xss');

const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return xss(input);
    }
    if (typeof input === 'object') {
        return Object.keys(input).reduce((acc, key) => {
            acc[key] = sanitizeInput(input[key]);
            return acc;
        }, {});
    }
    return input;
};

const determineSeverity = (action) => {
    // Define severity levels for different actions
    const severityMap = {
        // Critical actions
        'LOGIN_FAILURE': 'CRITICAL',
        'PASSWORD_RESET': 'CRITICAL',
        'DOCUMENT_VERIFICATION_FAILURE': 'CRITICAL',
        'KYC_SUBMISSION_ERROR': 'CRITICAL',
        
        // Error actions
        'DOCUMENT_UPLOAD_ERROR': 'ERROR',
        'VERIFICATION_ERROR': 'ERROR',
        'DOCUMENT_ACCESS_ERROR': 'ERROR',
        'KYC_STATUS_ERROR': 'ERROR',
        
        // Warning actions
        'RATE_LIMIT_EXCEEDED': 'WARNING',
        'INVALID_DOCUMENT': 'WARNING',
        'MISSING_REQUIRED_FIELDS': 'WARNING',
        
        // Info actions (default)
        'DOCUMENT_UPLOAD': 'INFO',
        'DOCUMENT_VERIFICATION': 'INFO',
        'KYC_SUBMISSION': 'INFO',
        'KYC_STATUS_CHECK': 'INFO',
        'DOCUMENT_ACCESS': 'INFO'
    };

    // Check if the action ends with _ERROR or _FAILURE
    if (action.endsWith('_ERROR') || action.endsWith('_FAILURE')) {
        return 'ERROR';
    }

    // Check if the action ends with _WARNING
    if (action.endsWith('_WARNING')) {
        return 'WARNING';
    }

    // Return mapped severity or default to INFO
    return severityMap[action] || 'INFO';
};

const auditLogger = {
    log: async (userId, action, details) => {
        try {
            // Sanitize all inputs
            const sanitizedDetails = sanitizeInput(details);
            
            // Determine severity based on action
            const severity = determineSeverity(action);
            
            await AuditLog.create({
                user_id: userId,
                action: action,
                request_details: sanitizedDetails,
                ip_address: details.ipAddress || 'unknown',
                user_agent: details.userAgent || 'unknown',
                severity: severity,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Audit logging failed:', error);
            // Don't throw the error to prevent disrupting the main flow
        }
    },

    getActivityLogs: async (filters) => {
        try {
            // Sanitize filters
            const sanitizedFilters = sanitizeInput(filters);
            
            return await AuditLog.findAll({
                where: sanitizedFilters,
                order: [['timestamp', 'DESC']],
                limit: 100
            });
        } catch (error) {
            console.error('Failed to retrieve audit logs:', error);
            throw new Error('Failed to retrieve audit logs');
        }
    }
};

module.exports = auditLogger; 