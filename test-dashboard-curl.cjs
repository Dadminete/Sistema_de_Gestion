#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing dashboard endpoint via HTTP...\n');

const options = {
  hostname: 'localhost',
  port: 54116,
  path: '/api/cajas/dashboard',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers: ${JSON.stringify(res.headers)}\n`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Response received:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check key fields
      console.log('\n📊 Key Data Points:');
      console.log(`- ingresosHoyCajaPrincipal: ${parsed.ingresosHoyCajaPrincipal}`);
      console.log(`- chart data points: ${parsed.chartData?.length || 0}`);
      console.log(`- cajas count: ${parsed.cajas?.length || 0}`);
      
    } catch (e) {
      console.log('❌ Failed to parse JSON:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

req.end();
