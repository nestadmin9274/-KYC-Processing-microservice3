const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const kycController = require('../controllers/kycController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validation middleware
const validateKycSubmission = [
  body('documentType').isIn(['AADHAAR', 'PAN', 'PASSPORT']),
  body('documentNumber').notEmpty().trim()
];

// Routes
router.post(
  '/submit',
  authMiddleware,
  upload.single('document'),
  validateKycSubmission,
  kycController.submitKyc
);

router.get(
  '/status',
  authMiddleware,
  kycController.getKycStatus
);

// Admin route for verification
router.put(
  '/verify',
  authMiddleware,
  [
    body('documentId').isUUID(),
    body('status').isIn(['VERIFIED', 'REJECTED']),
    body('notes').optional().trim()
  ],
  kycController.verifyKyc
);

module.exports = router;