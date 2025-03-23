const KycDocument = require('../models/KycDocument');
const UserProfession = require('../models/UserProfession');
const { validationResult } = require('express-validator');
const HyperVergeService = require('../services/hypervergeService');
const { uploadToS3, getS3SignedUrl } = require('../config/s3.config');

exports.submitKyc = async (req, res) => {
  try {
    const { profession, sector, platform, companyName, gstin, annualIncome } = req.body;
    const userId = req.user.id;

    // Store profession details
    await UserProfession.create({
      userId,
      profession,
      sector,
      platform,
      companyName,
      gstin,
      annualIncome
    });

    // Verify PAN and other documents with HyperVerge
    const kycDocuments = await KycDocument.findAll({ where: { userId } });

    // console.log("kycDocuments",kycDocuments);

    for (const doc of kycDocuments) {
      const verificationResult = await HyperVergeService.verifyDocument(doc.documentPath, doc.documentType); //need to pass userprofession details as well

      // Update verification status
      doc.verificationStatus = verificationResult.status;
      doc.verificationNotes = verificationResult.message;
      doc.verifiedAt = new Date();
      await doc.save();
    }

    res.status(200).json({ message: 'KYC submitted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error submitting KYC', error });
  }
};

exports.uploadKycDocuments = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { documentType, documentNumber } = req.body;
    const userId = req.user.id;

    // const documentPath = req.file.path; //used when we have to store file in server itself (in /upload dir)
    const documentPath = await uploadToS3(req.file.buffer, `${userId}_${documentType}_${Date.now()}`, req.file.mimetype);

    const kyc = await KycDocument.create({
      userId,
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
    const userId  = req.user.id;
    const documents = await KycDocument.findAll({ where: { userId } });

    const allVerified = documents.every(doc => doc.verificationStatus === 'VERIFIED');
    const kycStatus = allVerified ? 'VERIFIED' : 'PENDING';

    res.status(200).json({ kycStatus, documents });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching KYC status', error });
  }
};

exports.verifyKyc = async (req, res) => {
  try {
    const { documentId, status, notes } = req.body;

    const kyc = await KycDocument.findByPk(documentId);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC document not found' });
    }

    if(kyc.verificationStatus == 'VERIFIED'){
      res.status(401).json({
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

exports.getUserDocumentsWithSignedUrls = async (req, res) => {
  try {
    const { userId } = req.params;

    // Retrieve user documents from the database
    const documents = await KycDocument.findAll({
      where: { userId }
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
          documentNumber: doc.documentNumber,
          verificationStatus: doc.verificationStatus,
          verificationNotes: doc.verificationNotes,
          uploadedAt: doc.createdAt,
          signedUrl
        };
      })
    );

    res.status(200).json({ message: 'Documents retrieved successfully', documents: signedDocuments });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};