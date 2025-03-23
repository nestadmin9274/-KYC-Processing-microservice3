require("dotenv").config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to upload file to S3
const uploadToS3 = async (fileBuffer, fileName, mimetype) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `document/${fileName}`,
    Body: fileBuffer,
    ContentType: mimetype,
  };

  await s3.send(new PutObjectCommand(params));
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/document/${fileName}`;
};

// Function to generate a pre-signed URL for fetching profile pictures
const getS3SignedUrl = async (fileUrl) => {
  const s3Key = fileUrl.split(".com/")[1]; // Extract S3 object key from full URL

  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
};

module.exports = { s3, uploadToS3, getS3SignedUrl };
