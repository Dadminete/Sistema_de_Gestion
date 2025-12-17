const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'services', 'cajaService.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Corrigiendo cajaService.js...');

// Reemplazar PrismaRetry. por prisma.
const matches = content.match(/PrismaRetry\./g);
if (matches) {
  content = content.replace(/PrismaRetry\./g, 'prisma.');
  console.log(`✅ Reemplazadas ${matches.length} llamadas de PrismaRetry. por prisma.`);
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Archivo corregido');
} else {
  console.log('No se encontraron ocurrencias para reemplazar');
}