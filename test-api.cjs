const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 54116,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('\n=== TEST API ENDPOINTS ===\n');

    // Test 1: Get dashboard stats
    console.log('1️⃣  Testing GET /api/cajas/dashboard...');
    const dashboardRes = await makeRequest('/api/cajas/dashboard');
    if (dashboardRes.status === 200) {
      console.log(`✅ Status: ${dashboardRes.status}`);
      console.log(`   Ingresos Hoy: RD$ ${dashboardRes.data.stats.ingresosHoyCajaPrincipal}`);
      console.log(`   Ingresos Papelería: RD$ ${dashboardRes.data.stats.ingresosHoyPapeleria}\n`);
    } else {
      console.log(`❌ Status: ${dashboardRes.status}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
