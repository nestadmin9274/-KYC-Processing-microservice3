const crypto = require('crypto');

const piiProtection = {
    // Mask PII data
    maskPII: (data, type) => {
        switch(type) {
            case 'email':
                return data.replace(/(?<=.{3}).(?=.*@)/g, '*');
            case 'phone':
                return data.replace(/\d(?=\d{4})/g, '*');
            case 'ssn':
                return data.replace(/\d(?=\d{4})/g, '*');
            default:
                return data;
        }
    },

    // Encrypt PII data
    encryptPII: (data, key) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: cipher.getAuthTag().toString('hex')
        };
    }
};

module.exports = piiProtection; 