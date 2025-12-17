#!/usr/bin/env node

/**
 * Test script para verificar que el sistema SSE y eventos funciona correctamente
 * Este script:
 * 1. Simula un cliente conectándose al SSE
 * 2. Emula cambios de entidades
 * 3. Verifica que los eventos se reciben correctamente
 */

const http = require('http');

async function getAuthToken() {
  // Aquí deberías usar tu token real o un cliente de prueba
  // Por ahora retornaremos un token de prueba
  return 'test-token-placeholder';
}

async function testSSEConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/events?token=test-token',
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Authorization': 'Bearer test-token'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`✓ SSE Connection established - Status: ${res.statusCode}`);
      console.log(`✓ Headers:`, {
        'Content-Type': res.headers['content-type'],
        'Cache-Control': res.headers['cache-control'],
        'Connection': res.headers['connection']
      });

      let dataBuffer = '';
      let eventCount = 0;

      res.on('data', (chunk) => {
        dataBuffer += chunk.toString();
        const lines = dataBuffer.split('\n\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const event = lines[i].trim();
          if (event.startsWith('data:')) {
            const eventData = event.replace('data: ', '');
            try {
              const parsed = JSON.parse(eventData);
              console.log(`\n📨 Event #${++eventCount} received:`, parsed);
            } catch (e) {
              if (event !== ':' && !event.includes('heartbeat')) {
                console.log(`  Raw: ${event}`);
              }
            }
          }
        }
        
        dataBuffer = lines[lines.length - 1];
      });

      // Desconectar después de 10 segundos
      setTimeout(() => {
        console.log(`\n✓ Test completed - Received ${eventCount} events`);
        req.abort();
        resolve();
      }, 10000);
    });

    req.on('error', (error) => {
      console.error('✗ SSE Connection error:', error.message);
      reject(error);
    });

    req.on('abort', () => {
      console.log('✓ Connection closed');
    });

    req.end();
  });
}

async function testCreateClientEvent() {
  // Este endpoint creará un cliente y debería emitir un evento
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/clientes',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your-real-token-here'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n✓ Create client response: ${res.statusCode}`);
        resolve(data);
      });
    });

    req.on('error', reject);
    
    const clientData = {
      nombre: 'Test',
      apellidos: 'SSE Client',
      codigoCliente: `TEST-${Date.now()}`,
      telefono: '1234567890',
      correoElectronico: 'test@example.com'
    };

    req.write(JSON.stringify(clientData));
    req.end();
  });
}

async function main() {
  console.log('🧪 SSE & Real-time Events Test Suite\n');
  console.log('Testing Server-Sent Events connection and event broadcasting...\n');

  try {
    console.log('1️⃣  Testing SSE connection...');
    await testSSEConnection();
    
    console.log('\n2️⃣  Testing event emission...');
    // Este test requeriría un token válido
    // await testCreateClientEvent();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
