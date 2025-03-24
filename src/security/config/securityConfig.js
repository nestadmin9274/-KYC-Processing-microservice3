const securityConfig = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
        refreshExpiresIn: '7d'
    },
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: {
            status: 429,
            message: 'Too many requests, please try again later.'
        }
    },
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        credentials: true,
        maxAge: 3600
    },
    session: {
        secret: process.env.SESSION_SECRET,
        duration: 24 * 60 * 60 * 1000, // 24 hours
        activeDuration: 1000 * 60 * 5 // 5 minutes
    },
    passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
    }
}

module.exports = securityConfig; 