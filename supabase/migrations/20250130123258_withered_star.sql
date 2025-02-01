/*
  # KYC Service Database Schema

  1. Tables
    - `kyc_documents`: Stores KYC document information and verification status
    
  2. Enums
    - Document types (AADHAAR, PAN, PASSPORT)
    - Verification status (PENDING, VERIFIED, REJECTED)
*/

-- Create custom enum types
CREATE TYPE document_type AS ENUM ('AADHAAR', 'PAN', 'PASSPORT');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- Create KYC documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type document_type NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  verification_status verification_status DEFAULT 'PENDING',
  verification_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_status ON kyc_documents(verification_status);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating timestamp
CREATE TRIGGER update_kyc_documents_updated_at
    BEFORE UPDATE ON kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();