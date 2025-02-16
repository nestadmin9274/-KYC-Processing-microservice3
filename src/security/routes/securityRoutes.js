const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Authentication routes
router.post('/login', securityController.login);
router.post('/refresh-token', securityController.refreshToken);
router.post('/logout', verifyToken, securityController.logout);

// Security management routes
router.post('/mfa/enable', verifyToken, securityController.enableMFA);
router.post('/mfa/verify', verifyToken, securityController.verifyMFA);
router.post('/mfa/disable', verifyToken, securityController.disableMFA);

// Audit routes
router.get('/audit-logs', 
    verifyToken, 
    checkRole(['admin']), 
    securityController.getAuditLogs
);

module.exports = router; 