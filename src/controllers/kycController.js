const KycDocument = require('../models/KycDocument');
const UserProfession = require('../models/UserProfession');
const { validationResult } = require('express-validator');
const HyperVergeService = require('../services/hypervergeService');
const { uploadToS3, getS3SignedUrl } = require('../config/s3.config');
const { encrypt, decrypt } = require('../security/utils/encryption');
const { auditLogger } = require('../security/middleware');
const { sanitizeInput, sanitizeSQL, validateKycDocument } = require('../security/utils/sanitizer');

exports.submitKyc = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedBody = sanitizeInput(req.body);
    const { profession, sector, platform, companyName, gstin, annualIncome } = sanitizedBody;
    const userId = req.user.userId;

    // Encrypt sensitive data
    const encryptedGstin = gstin ? encrypt(gstin) : null;
    const encryptedCompanyName = companyName ? encrypt(companyName) : null;

    // Store profession details with encrypted data
    await UserProfession.create({
      userId,
      profession,
      sector,
      platform,
      companyName: encryptedCompanyName,
      gstin: encryptedGstin,
      annualIncome
    });

    // Verify PAN and other documents with HyperVerge
    const kycDocuments = await KycDocument.findAll({ 
      where: sanitizeSQL({ userId }) 
    });

    for (const doc of kycDocuments) {
      const verificationResult = await HyperVergeService.verifyDocument(doc.documentPath, doc.documentType);

      // Update verification status
      doc.verificationStatus = verificationResult.status;
      doc.verificationNotes = verificationResult.message;
      doc.verifiedAt = new Date();
      await doc.save();

      // Log verification attempt
      auditLogger.log(userId, 'DOCUMENT_VERIFICATION', {
        documentId: doc.id,
        documentType: doc.documentType,
        status: verificationResult.status
      });
    }

    res.status(200).json({ message: 'KYC submitted successfully' });

  } catch (error) {
    auditLogger.log(req.user.userId, 'KYC_SUBMISSION_ERROR', { error: error.message });
    res.status(500).json({ message: 'Error submitting KYC', error: error.message });
  }
};

exports.uploadKycDocuments = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedBody = sanitizeInput(req.body);
    const { documentType, documentNumber } = sanitizedBody;
    const userId = req.user.userId;

    // Validate document
    const document = {
      documentType,
      documentNumber,
      file: req.file
    };

    const validationResult = validateKycDocument(document);
    if (!validationResult.isValid) {
      return res.status(400).json({
        message: 'Invalid document',
        errors: validationResult.errors
      });
    }

    // Encrypt document number
    const encryptedDocumentNumber = encrypt(documentNumber);

    // Verify encryption by decrypting
    const decryptedNumber = decrypt(encryptedDocumentNumber);
    if (decryptedNumber !== documentNumber) {
      throw new Error('Encryption verification failed');
    }

    // Upload to S3 with secure naming
    const documentPath = await uploadToS3(
      req.file.buffer,
      `${userId}_${documentType}_${Date.now()}`,
      req.file.mimetype
    );

    const kyc = await KycDocument.create({
      userId,
      documentType,
      documentNumber: encryptedDocumentNumber,
      documentPath
    });

    // Log document upload
    auditLogger.log(userId, 'DOCUMENT_UPLOAD', {
      documentId: kyc.id,
      documentType,
      path: documentPath
    });

    res.status(201).json({
      message: 'KYC document submitted successfully',
      data: {
        ...kyc.toJSON(),
        documentNumber: documentNumber // Send original number in response
      }
    });
  } catch (error) {
    auditLogger.log(req.user.userId, 'DOCUMENT_UPLOAD_ERROR', { error: error.message });
    res.status(500).json({
      message: 'Error submitting KYC document',
      error: error.message
    });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const documents = await KycDocument.findAll({ 
      where: sanitizeSQL({ userId }) 
    });

    const allVerified = documents.every(doc => doc.verificationStatus === 'VERIFIED');
    const kycStatus = allVerified ? 'VERIFIED' : 'PENDING';

    // Log status check
    auditLogger.log(userId, 'KYC_STATUS_CHECK', { status: kycStatus });

    res.status(200).json({ kycStatus, documents });

  } catch (error) {
    auditLogger.log(req.user.userId, 'KYC_STATUS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Error fetching KYC status', error: error.message });
  }
};

exports.verifyKyc = async (req, res) => {
  try {
    // Sanitize input
    const sanitizedBody = sanitizeInput(req.body);
    const { documentId, status, notes } = sanitizedBody;
    const verifierId = req.user.id;

    const kyc = await KycDocument.findByPk(documentId);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC document not found' });
    }

    if(kyc.verificationStatus === 'VERIFIED'){
      return res.status(401).json({
        message: 'Error updating KYC verification',
        error: "This document is already verified"
      });
    }

    kyc.verificationStatus = status;
    kyc.verificationNotes = notes;
    if (status === 'VERIFIED') {
      kyc.verifiedAt = new Date();
    }
    await kyc.save();

    // Log verification
    auditLogger.log(verifierId, 'DOCUMENT_VERIFICATION', {
      documentId,
      status,
      notes
    });

    res.json({
      message: 'KYC verification status updated',
      data: kyc
    });
  } catch (error) {
    auditLogger.log(req.user.id, 'VERIFICATION_ERROR', { error: error.message });
    res.status(500).json({
      message: 'Error updating KYC verification',
      error: error.message
    });
  }
};

exports.getUserDocumentsWithSignedUrls = async (req, res) => {
  try {
    // Sanitize params
    const sanitizedParams = sanitizeInput(req.params);
    const { userId } = sanitizedParams;
    const requesterId = req.user.id;

    // Retrieve user documents from the database
    const documents = await KycDocument.findAll({
      where: sanitizeSQL({ userId })
    });

    if (documents.length === 0) {
      return res.status(404).json({ message: 'No documents found for this user' });
    }

    // Generate signed URLs for each document
    const signedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const signedUrl = await getS3SignedUrl(doc.documentPath);
        return {
          id: doc.id,
          documentType: doc.documentType,
          documentNumber: decrypt(doc.documentNumber),
          verificationStatus: doc.verificationStatus,
          verificationNotes: doc.verificationNotes,
          uploadedAt: doc.createdAt,
          signedUrl
        };
      })
    );

    // Log document access
    auditLogger.log(requesterId, 'DOCUMENT_ACCESS', {
      targetUserId: userId,
      documentCount: documents.length
    });

    res.status(200).json({ 
      message: 'Documents retrieved successfully', 
      documents: signedDocuments 
    });

  } catch (error) {
    auditLogger.log(req.user.id, 'DOCUMENT_ACCESS_ERROR', { error: error.message });
    console.error('Error fetching documents:', error);
    res.status(500).json({ 
      message: 'Failed to fetch documents', 
      error: error.message 
    });
  }
};