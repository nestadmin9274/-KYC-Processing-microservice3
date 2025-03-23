const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KycDocument = sequelize.define('KycDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  documentType: { // Multiple document types
    type: DataTypes.ENUM(
      'SELFIE',
      'STUDENT_ID',
      'PAY_SLIP',
      'GSTIN_CERTIFICATE',
      'BANK_STATEMENT',
      'PAN_FRONT',
      'PAN_BACK'
    ),
    allowNull: false
  },
  documentNumber: { // For PAN, GSTIN, etc.
    type: DataTypes.STRING
  },
  documentPath: { // S3 Path or File URL
    type: DataTypes.STRING,
    allowNull: false
  },
  verificationStatus: {
    type: DataTypes.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  verificationNotes: {
    type: DataTypes.TEXT
  },
  verifiedAt: {
    type: DataTypes.DATE
  }
});

module.exports = KycDocument;
