// Simple test for debug endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 54118,
  path: '/api/clients/debug-recent-subscribed?limit=5',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Error:', err);
});

req.end();