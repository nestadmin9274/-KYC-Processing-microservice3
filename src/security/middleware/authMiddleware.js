const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/securityConfig');

const authMiddleware = {
    verifyToken: (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ message: 'No token provided' });
            }

            const decoded = jwt.verify(token, jwtConfig.secret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    },

    checkRole: (roles) => (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    }
};

module.exports = authMiddleware; 