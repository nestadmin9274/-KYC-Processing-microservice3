const crypto = require('crypto');
const { encryption: encConfig } = require('../config/securityConfig');

// Generate a consistent 32-byte key from the environment variable or create a new one
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : crypto.randomBytes(32);

const encryptionUtils = {
    encrypt: (data) => {
        try {
            if (!data) return null;
            
            // Generate a random IV for each encryption
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
            
            // Encrypt the data
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Get the auth tag
            const authTag = cipher.getAuthTag();
            
            // Combine IV, encrypted data, and auth tag
            const combined = Buffer.concat([
                iv,
                Buffer.from(encrypted, 'hex'),
                authTag
            ]);
            
            // Return base64 encoded string
            return combined.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    },

    decrypt: (encryptedData) => {
        try {
            if (!encryptedData) return null;
            
            // Convert base64 back to buffer
            const buffer = Buffer.from(encryptedData, 'base64');
            
            // Extract IV (first 16 bytes)
            const iv = buffer.slice(0, 16);
            
            // Extract auth tag (last 16 bytes)
            const authTag = buffer.slice(-16);
            
            // Extract encrypted data (middle part)
            const encrypted = buffer.slice(16, -16).toString('hex');
            
            // Create decipher
            const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
            decipher.setAuthTag(authTag);
            
            // Decrypt the data
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Decryption failed');
        }
    }
};

module.exports = encryptionUtils; 