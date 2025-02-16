const complianceConfig = require('../config/complianceConfig');
const AuditLog = require('../models/AuditLog');

const complianceMiddleware = {
    iso27001Compliance: (req, res, next) => {
        // Skip session check for public routes
        if (req.path === '/api/security/login' || req.path === '/health') {
            return next();
        }

        // Implement access control checks
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
    },

    soc2Compliance: async (req, res, next) => {
        try {
            // Skip audit logging for health check and public routes
            if (req.path === '/health' || req.path === '/api/security/login') {
                return next();
            }

            // Implement SOC 2 monitoring
            const { monitoring } = complianceConfig.soc2;
            
            // Log access for audit trail
            if (monitoring.auditTrail.enabled) {
                await AuditLog.create({
                    userId: req.user?.id || null,  // Handle null case
                    action: req.method,
                    details: {
                        path: req.path,
                        body: req.method !== 'GET' ? req.body : undefined,
                        params: Object.keys(req.params).length ? req.params : undefined
                    },
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.headers['user-agent']
                });
            }
            
            next();
        } catch (error) {
            console.error('SOC2 Compliance Error:', error);
            // Don't block the request if audit logging fails
            next();
        }
    },

    kycAmlCompliance: async (req, res, next) => {
        try {
            // Skip KYC/AML checks for non-KYC routes
            if (!req.path.includes('/kyc')) {
                return next();
            }

            // Validate KYC document requirements
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
            
            // Apply enhanced due diligence for high-risk cases
            if (req.body.riskCategory === 'high') {
                // Implement additional checks
            }
            
            next();
        } catch (error) {
            console.error('KYC/AML Compliance Error:', error);
            next(error);
        }
    }
};

module.exports = complianceMiddleware; 