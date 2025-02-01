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
  documentType: {
    type: DataTypes.ENUM('AADHAAR', 'PAN', 'PASSPORT'),
    allowNull: false
  },
  documentNumber: {
    type: DataTypes.STRING,
    allowNull: false
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
});

module.exports = KycDocument;