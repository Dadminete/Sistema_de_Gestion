#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing dashboard endpoint from user\'s network...\n');

// User's IP address based on workspace context
const testUrls = [
  { hostname: 'localhost', port: 54116, name: 'Localhost' },
  { hostname: '127.0.0.1', port: 54116, name: 'Loopback' },
  { hostname: '172.16.0.23', port: 54116, name: 'User Network' },
];

let testsDone = 0;

testUrls.forEach(({ hostname, port, name }) => {
  console.log(`\n📍 Testing ${name} (${hostname}:${port})...`);
  
  const options = {
    hostname,
    port,
    path: '/api/cajas/dashboard',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(data);
          console.log(`   ✅ Data received: ${Object.keys(parsed).length} fields`);
          console.log(`   Ingresos Hoy: ${parsed.ingresosHoyCajaPrincipal}`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
      } else {
        console.log(`   Response: ${data}`);
      }
      testsDone++;
      if (testsDone === testUrls.length) process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.log(`   ❌ ${error.message}`);
    testsDone++;
    if (testsDone === testUrls.length) process.exit(0);
  });

  req.end();
});
