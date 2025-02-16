const complianceConfig = require('../config/complianceConfig');
const AuditLog = require('../models/AuditLog');

const amlMonitoring = {
    checkTransaction: async (transaction) => {
        const { monitoring } = complianceConfig.aml;
        const alerts = [];

        // Check transaction thresholds
        if (transaction.amount > monitoring.transactionThresholds.single) {
            alerts.push({
                type: 'THRESHOLD_EXCEEDED',
                details: 'Single transaction limit exceeded'
            });
        }

        // Check for suspicious patterns
        const isStructuring = await checkStructuring(transaction);
        if (isStructuring) {
            alerts.push({
                type: 'SUSPICIOUS_PATTERN',
                details: 'Possible structuring detected'
            });
        }

        return alerts;
    },

    screenEntity: async (entity) => {
        const { screening } = complianceConfig.aml;
        const matches = [];

        // Check against watchlists
        for (const watchlist of screening.watchlists) {
            const match = await checkWatchlist(entity, watchlist);
            if (match) {
                matches.push({
                    watchlist,
                    matchDetails: match
                });
            }
        }

        return matches;
    },

    calculateRiskScore: (entity) => {
        const { riskFactors } = complianceConfig.aml.screening;
        let riskScore = 0;

        // Calculate risk based on various factors
        riskFactors.forEach(factor => {
            const factorScore = evaluateRiskFactor(entity, factor);
            riskScore += factorScore;
        });

        return {
            score: riskScore,
            category: getRiskCategory(riskScore)
        };
    }
};

module.exports = amlMonitoring; 