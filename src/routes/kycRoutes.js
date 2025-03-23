const express = require('express');
const { body, validationResult, param } = require('express-validator');
const router = express.Router();
const kycController = require('../controllers/kycController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Middleware for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


// Validation middleware
const validateKycDoc = [
  body('documentType').isIn(['SELFIE','STUDENT_ID','PAY_SLIP','GSTIN_CERTIFICATE','BANK_STATEMENT','PAN_FRONT', 'PAN_BACK']).withMessage('Invalid document type'),
  body('documentNumber').notEmpty().trim()
];

// Upload KYC documents
router.post(
  '/upload',
  authMiddleware,
  upload.single('document'),
  validateKycDoc,
  kycController.uploadKycDocuments
);

// Submit KYC
router.post(
  '/submit',
  authMiddleware,
  [
    body('profession').isIn(['STUDENT', 'EMPLOYEE', 'GIG_ECONOMY', 'MSME']).withMessage('Invalid profession'),
    body('sector').optional().isIn(['GOVERNMENT', 'PRIVATE']).withMessage('Invalid sector'),
    body('platform').optional().isString().withMessage('Platform must be a string'),
    body('companyName').optional().isString().withMessage('Company name must be a string'),
    body('gstin').optional().isString().matches(/^[0-9A-Z]{15}$/).withMessage('Invalid GSTIN format'),
    body('annualIncome').isIn(['BELOW_1_LAKH', '1-5_LAKH', '4-10_LAKH', 'ABOVE_10_LAKH']).withMessage('Invalid income range')
  ],
  validateRequest,
  kycController.submitKyc
);


router.get(
  '/status',
  authMiddleware,
  kycController.getKycStatus
);


//Admin(or doc verify agent) Fetch user KYC documents with signed URLs
router.get(
  '/documents/:userId',
  authMiddleware,
  param('userId').isUUID().withMessage('Invalid user ID format'),
  validateRequest,
  kycController.getUserDocumentsWithSignedUrls
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