const jwt = require('jsonwebtoken');

// Generate a test token using the same secret as the server
const JWT_SECRET = 'super-secret-jwt-key-change-in-production-2025';
const token = jwt.sign(
  { 
    id: 'df4b1335-5ff6-4703-8dcd-3e2f74fb0822',
    username: 'admin',
    email: 'admin@test.com',
    roles: ['Administrador'],
    permissions: ['*']
  }, 
  JWT_SECRET, 
  { expiresIn: '1h' }
);

console.log('Generated test token:', token.substring(0, 50) + '...');

const http = require('http');

// Test the sessions endpoint
const options = {
  hostname: '172.16.0.23',
  port: 54116,
  path: '/api/sessions',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('\nTesting endpoint:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();