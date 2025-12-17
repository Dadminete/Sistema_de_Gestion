const https = require('https');
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSimple() {
  try {
    console.log('🔍 Testing simple endpoint access...');
    
    // Test health endpoint first
    const healthOptions = {
      hostname: 'localhost',
      port: 54118,
      path: '/health',
      method: 'GET'
    };
    
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await makeRequest(healthOptions);
    console.log('Health Status:', healthResponse.status);
    console.log('Health Data:', healthResponse.data);
    
    if (healthResponse.status === 200) {
      console.log('✅ Server is running');
      
      // Try to login with test credentials
      console.log('🔐 Attempting login...');
      
      const loginOptions = {
        hostname: 'localhost',
        port: 54118,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const loginData = {
        username: 'dadmin',
        password: 'admin123',
        rememberMe: false
      };
      
      const loginResponse = await makeRequest(loginOptions, loginData);
      console.log('Login Status:', loginResponse.status);
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        
        // Now test the recent clients endpoint
        console.log('🎯 Testing recent clients endpoint...');
        
        const clientsOptions = {
          hostname: 'localhost',
          port: 54118,
          path: '/api/clients/recent-subscribed?limit=5',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const clientsResponse = await makeRequest(clientsOptions);
        console.log('Clients Status:', clientsResponse.status);
        console.log('Clients Data:', JSON.stringify(clientsResponse.data, null, 2));
        
      } else {
        console.log('❌ Login failed:', loginResponse.data);
      }
      
    } else {
      console.log('❌ Server not responding correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimple();