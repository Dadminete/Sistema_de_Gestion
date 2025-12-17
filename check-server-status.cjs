#!/usr/bin/env node

const http = require('http');

console.log('🔍 Checking if server is running...\n');

const options = {
  hostname: 'localhost',
  port: 54116,
  path: '/api/cajas',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Server IS running!`);
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Server is NOT running on port 54116');
    console.error('   Please start the backend server with: npm run dev (from server folder)');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
});

req.end();
