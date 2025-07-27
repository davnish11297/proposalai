// Simple CORS test script
const fetch = require('node-fetch');

async function testCORS() {
  console.log('🧪 Testing CORS configuration...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      credentials: 'include'
    });
    
    console.log('✅ CORS test successful:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

testCORS(); 