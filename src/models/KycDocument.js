const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KycDocument = sequelize.define('KycDocument', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentType: {
    type: DataTypes.ENUM(
      'SELFIE',
      'STUDENT_ID',
      'PAY_SLIP',
      'GSTIN_CERTIFICATE',
      'BANK_STATEMENT',
      'PAN_FRONT',
      'PAN_BACK',
      'AADHAR_FRONT',
      'AADHAR_BACK',
      'PASSPORT'
    ),
    allowNull: false
  },
  documentNumber: {
    type: DataTypes.STRING
  },
  documentPath: {
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
}, {
  tableName: 'KycDocuments',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['documentType']
    },
    {
      fields: ['verificationStatus']
    }
  ]
});

module.exports = KycDocument;
