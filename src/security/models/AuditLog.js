const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    request_details: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_agent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    severity: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL'),
        allowNull: false,
        defaultValue: 'INFO'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'audit_logs',
    timestamps: false,
    underscored: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['action']
        },
        {
            fields: ['severity']
        },
        {
            fields: ['timestamp']
        }
    ]
});

module.exports = AuditLog; 