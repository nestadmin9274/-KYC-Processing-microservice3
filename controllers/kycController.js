const KycDocument = require('../models/KycDocument');
const { validationResult } = require('express-validator');
const path = require('path');

exports.submitKyc = async (req, res) => {
  try {
    // Validation check for any validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentType, documentNumber } = req.body;
    const documentPath = req.file?.path;

    // Validate the document number format (alphanumeric only, no special characters)
    const documentNumberRegex = /^[a-zA-Z0-9]+$/;
    if (!documentNumberRegex.test(documentNumber)) {
      return res.status(400).json({ message: 'Invalid document number format. Only alphanumeric characters are allowed.' });
    }

    // Validate the file format (only allowed formats: jpg, jpeg, png, pdf)
    if (!req.file) {
      return res.status(400).json({ message: 'File is required.' });
    }
    const allowedFileTypes = /jpeg|jpg|png|pdf/;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!allowedFileTypes.test(fileExtension)) {
      return res.status(400).json({ message: 'Invalid file format. Only JPG, JPEG, PNG, and PDF are allowed.' });
    }

    // Create the KYC document record in the database
    const kyc = await KycDocument.create({
      userId: req.user.id,
      documentType,
      documentNumber,
      documentPath
    });

    res.status(201).json({
      message: 'KYC document submitted successfully',
      data: kyc
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error submitting KYC document',
      error: error.message
    });
  }
};

exports.getKycStatus = async (req, res) => {
  try {
    const kyc = await KycDocument.findOne({
      where: { userId: req.user.id }
    });

    if (!kyc) {
      return res.status(404).json({ message: 'No KYC document found' });
    }

    res.json({
      status: kyc.verificationStatus,
      documentType: kyc.documentType,
      submittedAt: kyc.createdAt,
      verifiedAt: kyc.verifiedAt
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching KYC status',
      error: error.message
    });
  }
};

exports.verifyKyc = async (req, res) => {
  try {
    const { documentId, status, notes } = req.body;

    const kyc = await KycDocument.findByPk(documentId);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC document not found' });
    }

    kyc.verificationStatus = status;
    kyc.verificationNotes = notes;
    if (status === 'VERIFIED') {
      kyc.verifiedAt = new Date();
    }
    await kyc.save();

    res.json({
      message: 'KYC verification status updated',
      data: kyc
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating KYC verification',
      error: error.message
    });
  }
};
