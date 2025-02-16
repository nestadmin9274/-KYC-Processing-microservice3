const crypto = require('crypto');
const { encryption: encConfig } = require('../config/securityConfig');

const encryptionUtils = {
    generateKey: () => {
        return crypto.randomBytes(encConfig.keyLength);
    },

    encrypt: (data, key) => {
        const iv = crypto.randomBytes(encConfig.ivLength);
        const cipher = crypto.createCipheriv(encConfig.algorithm, key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            encrypted: encrypted,
            authTag: authTag.toString('hex')
        };
    },

    decrypt: (encryptedData, key, iv, authTag) => {
        const decipher = crypto.createDecipheriv(
            encConfig.algorithm,
            key,
            Buffer.from(iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
};

module.exports = encryptionUtils; 