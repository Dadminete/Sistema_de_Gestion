const axios = require('axios');

async function testWithAuth() {
  const baseURL = 'http://localhost:54118/api';
  
  try {
    console.log('🔐 Testing login first...');
    
    // Try to login with common test credentials
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin', // or try 'dadmin'
      password: 'admin123', // common test password
      rememberMe: false
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Now test the recent clients endpoint with authentication
      console.log('🔍 Testing recent clients endpoint with auth...');
      const clientsResponse = await axios.get(`${baseURL}/clients/recent-subscribed?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Recent clients response:', clientsResponse.status);
      console.log('📊 Data:', JSON.stringify(clientsResponse.data, null, 2));
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
      
      // If admin doesn't work, try dadmin
      console.log('🔄 Trying dadmin credentials...');
      const dadminResponse = await axios.post(`${baseURL}/auth/login`, {
        username: 'dadmin',
        password: 'admin123',
        rememberMe: false
      });
      
      if (dadminResponse.data.success && dadminResponse.data.token) {
        console.log('✅ Login successful with dadmin');
        const token = dadminResponse.data.token;
        
        const clientsResponse = await axios.get(`${baseURL}/clients/recent-subscribed?limit=5`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Recent clients response:', clientsResponse.status);
        console.log('📊 Data:', JSON.stringify(clientsResponse.data, null, 2));
      } else {
        console.log('❌ Dadmin login also failed');
      }
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error status:', error.response.status);
      console.log('❌ Error data:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testWithAuth();