const jwt = require('jsonwebtoken');

// Generate a test token using the same secret as the server
const token = jwt.sign(
  { id: 'test-id', email: 'admin@test.com' }, 
  'super-secret-key', 
  { expiresIn: '1h' }
);

console.log('Generated test token:', token.substring(0, 50) + '...');

const https = require('http');

// Test the endpoint
const options = {
  hostname: '172.16.0.23',
  port: 54116,
  path: '/api/facturas/pagos-mes/2025',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

console.log('\nTesting endpoint:', `${options.hostname}:${options.port}${options.path}`);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse body:');
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();