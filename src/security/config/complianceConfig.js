const complianceConfig = {
    iso27001: {
        accessControl: {
            maxLoginAttempts: 5,
            lockoutDuration: 30 * 60 * 1000, // 30 minutes
            passwordExpiryDays: 90,
            sessionTimeout: 15 * 60 * 1000 // 15 minutes
        },
        encryption: {
            minimumKeyLength: 256,
            allowedAlgorithms: ['AES-256-GCM', 'RSA-2048']
        },
        logging: {
            retentionPeriod: 365, // days
            requiredFields: ['timestamp', 'user', 'action', 'status', 'ip']
        }
    },
    soc2: {
        monitoring: {
            alertThresholds: {
                failedLogins: 3,
                unusualActivity: 'medium',
                dataAccess: 'high'
            },
            auditTrail: {
                enabled: true,
                detailedLogging: true
            }
        },
        dataProtection: {
            encryption: 'AES-256',
            dataClassification: ['public', 'internal', 'confidential', 'restricted']
        }
    },
    rbiKyc: {
        documentRequirements: {
            mandatory: ['proofOfIdentity', 'proofOfAddress', 'photograph'],
            optional: ['income_proof', 'employer_details']
        },
        verificationLevels: {
            minimum: ['identity_check', 'address_check'],
            enhanced: ['face_match', 'liveness_check', 'document_authenticity']
        },
        riskCategories: {
            low: { transactionLimit: 100000, reviewPeriod: 24 },
            medium: { transactionLimit: 50000, reviewPeriod: 12 },
            high: { transactionLimit: 10000, reviewPeriod: 6 }
        }
    },
    aml: {
        screening: {
            checkPoints: ['onboarding', 'periodic', 'transaction'],
            watchlists: ['UN', 'OFAC', 'PEP'],
            riskFactors: ['jurisdiction', 'business_type', 'transaction_pattern']
        },
        monitoring: {
            transactionThresholds: {
                single: 50000,
                aggregate: 100000,
                period: 30 // days
            },
            suspiciousPatterns: ['structuring', 'smurfing', 'rapid_movement']
        }
    }
};

module.exports = complianceConfig; 