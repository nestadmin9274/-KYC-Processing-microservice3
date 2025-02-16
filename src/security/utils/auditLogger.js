const AuditLog = require('../models/AuditLog');

const auditLogger = {
    log: async (userId, action, details) => {
        try {
            await AuditLog.create({
                userId,
                action,
                details,
                timestamp: new Date(),
                ipAddress: req.ip
            });
        } catch (error) {
            console.error('Audit logging failed:', error);
        }
    },

    getActivityLogs: async (filters) => {
        try {
            return await AuditLog.find(filters)
                .sort({ timestamp: -1 })
                .limit(100);
        } catch (error) {
            throw new Error('Failed to retrieve audit logs');
        }
    }
};

module.exports = auditLogger; 