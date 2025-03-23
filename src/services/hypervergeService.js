const axios = require('axios');

const HYPERVERGE_BASE_URL = 'https://ind.hyperverge.co/api/v3.0/kyc';
const HYPERVERGE_API_KEY = process.env.HYPERVERGE_API_KEY;

// ✅ Verify Document with HyperVerge
exports.verifyDocument = async (documentPath, documentType) => {
  try {
    const formData = new FormData();
    formData.append('file', documentPath);
    formData.append('documentType', documentType);

    // const response = await axios.post(`${HYPERVERGE_BASE_URL}/document`, formData, {
    //   headers: {
    //     'content-type': 'multipart/form-data',
    //     'Authorization': `Bearer ${HYPERVERGE_API_KEY}`
    //   }
    // });

    const response = { data : {status: 'success'}}; // for local test only

    return {
      status: response.data.status === 'success' ? 'VERIFIED' : 'REJECTED',
      message: response.data.message
    };

  } catch (error) {
    console.error('HyperVerge verification failed:', error);
    return { status: 'REJECTED', message: 'Verification failed' };
  }
};
