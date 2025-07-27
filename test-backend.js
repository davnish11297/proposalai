// Test backend API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testBackend() {
  console.log('🧪 Testing Backend API...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.status);
    
    // Test auth endpoints
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password'
    });
    console.log('✅ Auth endpoint accessible');
    
  } catch (error) {
    if (error.response) {
      console.log('⚠️  Auth endpoint returned:', error.response.status);
    } else {
      console.log('❌ Backend not accessible:', error.message);
    }
  }
}

testBackend(); 