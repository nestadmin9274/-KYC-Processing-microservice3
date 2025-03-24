const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfession = sequelize.define('UserProfession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  profession: {
    type: DataTypes.ENUM('STUDENT', 'EMPLOYEE', 'GIG_ECONOMY', 'MSME'),
    allowNull: false
  },
  sector: { // For employees (Government or Private)
    type: DataTypes.ENUM('GOVERNMENT', 'PRIVATE'),
    allowNull: true
  },
  platform: { // For Gig economy users
    type: DataTypes.STRING,
    allowNull: true
  },
  companyName: { // For MSME users
    type: DataTypes.STRING,
    allowNull: true
  },
  gstin: { // For MSME users
    type: DataTypes.STRING,
    allowNull: true
  },
  annualIncome: {
    type: DataTypes.ENUM('BELOW_1_LAKH', '1-5_LAKH', '4-10_LAKH', 'ABOVE_10_LAKH'),
    allowNull: false
  }
}, {
  tableName: 'UserProfessions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['profession']
    }
  ]
});

module.exports = UserProfession;
