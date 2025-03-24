const xss = require('xss');
const { escape } = require('validator');

// Document validation patterns
const documentPatterns = {
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    aadhar: /^\d{4}\s?\d{4}\s?\d{4}$/,
    passport: /^[A-Z]{1}[0-9]{7}$/,
    gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    phone: /^[6-9]\d{9}$/
};

// Document type validation
const validDocumentTypes = [
    'SELFIE',
    'STUDENT_ID',
    'PAY_SLIP',
    'GSTIN_CERTIFICATE',
    'BANK_STATEMENT',
    'PAN_FRONT',
    'PAN_BACK',
    'AADHAR_FRONT',
    'AADHAR_BACK',
    'PASSPORT'
];

// Validate document number based on type
const validateDocumentNumber = (documentType, documentNumber) => {
    if (!documentNumber) return false;

    switch (documentType) {
        case 'PAN_FRONT':
        case 'PAN_BACK':
            return documentPatterns.pan.test(documentNumber);
        case 'AADHAR_FRONT':
        case 'AADHAR_BACK':
            return documentPatterns.aadhar.test(documentNumber);
        case 'PASSPORT':
            return documentPatterns.passport.test(documentNumber);
        case 'GSTIN_CERTIFICATE':
            return documentPatterns.gstin.test(documentNumber);
        default:
            return true; // For other document types, just ensure it's not empty
    }
};

// Validate document type
const validateDocumentType = (documentType) => {
    return validDocumentTypes.includes(documentType);
};

// Sanitize string input
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return xss(str.trim());
};

// Sanitize object input
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitizeInput(obj[key]);
        return acc;
    }, {});
};

// Main sanitize function
const sanitizeInput = (input) => {
    if (!input) return input;

    if (typeof input === 'string') {
        return sanitizeString(input);
    }

    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }

    if (typeof input === 'object') {
        return sanitizeObject(input);
    }

    return input;
};

const sanitizeSQL = (input) => {
    if (!input) return input;

    if (typeof input === 'string') {
        return input.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    }

    if (typeof input === 'object') {
        return Object.keys(input).reduce((acc, key) => {
            acc[key] = sanitizeSQL(input[key]);
            return acc;
        }, {});
    }

    return input;
};

// Validate KYC document
const validateKycDocument = (document) => {
    const errors = [];

    // Validate document type
    if (!validateDocumentType(document.documentType)) {
        errors.push('Invalid document type');
    }

    // Validate document number if present
    if (document.documentNumber && !validateDocumentNumber(document.documentType, document.documentNumber)) {
        errors.push('Invalid document number format');
    }

    // Validate file size (max 5MB)
    if (document.file && document.file.size > 5 * 1024 * 1024) {
        errors.push('File size exceeds 5MB limit');
    }

    // Validate file type
    if (document.file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(document.file.mimetype)) {
            errors.push('Invalid file type. Only JPEG, PNG and PDF allowed');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    sanitizeInput,
    sanitizeSQL,
    validateKycDocument,
    validateDocumentNumber,
    validateDocumentType,
    documentPatterns
}; 