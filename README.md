# KYC Microservice

This microservice handles KYC (Know Your Customer) document verification processes.

## Features

- Document submission (Aadhaar, PAN, Passport)
- Document verification status tracking
- Secure file storage
- JWT-based authentication
- Admin verification interface

## API Endpoints

### Submit KYC Document
```http
POST /api/kyc/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "documentType": "AADHAAR",
  "documentNumber": "1234-5678-9012",
  "document": <file>
}
```

### Check KYC Status
```http
GET /api/kyc/status
Authorization: Bearer <token>
```

### Verify KYC Document (Admin)
```http
PUT /api/kyc/verify
Authorization: Bearer <token>

{
  "documentId": "uuid",
  "status": "VERIFIED",
  "notes": "All documents verified successfully"
}
```

## Setup Instructions

1. Clone the repository
2. Copy `.env.example` to `.env` and update the values
3. Create the PostgreSQL database
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create an 'uploads' directory in the root folder
6. Start the server:
   ```bash
   npm run dev
   ```

## Database Schema

The service uses PostgreSQL with the following schema:

### KycDocument Table
- id (UUID, Primary Key)
- userId (UUID)
- documentType (ENUM: AADHAAR, PAN, PASSPORT)
- documentNumber (String)
- documentPath (String)
- verificationStatus (ENUM: PENDING, VERIFIED, REJECTED)
- verificationNotes (Text)
- verifiedAt (Timestamp)
- createdAt (Timestamp)
- updatedAt (Timestamp)

## Security Measures

- JWT authentication
- File type validation
- File size limits
- Secure file storage
- Input validation
- Error handling

## Integration

To integrate with the main service:

1. Make HTTP requests to the KYC microservice endpoints
2. Pass the JWT token from the main service
3. Handle the responses accordingly
4. Store the KYC document IDs in the main service for reference

## Testing

Use Postman to test the API endpoints. Import the following collection:

[Download Postman Collection](link-to-postman-collection)