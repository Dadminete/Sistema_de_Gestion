const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server', 'services', 'averiasService.js');
let content = fs.readFileSync(file, 'utf8');

console.log('🔧 Actualizando averiasService.js para usar PrismaRetry...\n');

// 1. Cambiar import
content = content.replace(
  "const prisma = require('../prismaClient');",
  "const PrismaRetry = require('../prismaRetry');\nconst prisma = new PrismaRetry();"
);

// 2. Reemplazar todas las llamadas prisma.ticket
const ticketReplacements = [
  'prisma.ticket.findMany',
  'prisma.ticket.count',
  'prisma.ticket.groupBy',
  'prisma.ticket.findUnique',
  'prisma.ticket.update',
  'prisma.ticket.delete'
];

let totalReplacements = 0;
ticketReplacements.forEach(pattern => {
  const regex = new RegExp(pattern.replace('.', '\\.'), 'g');
  const matches = content.match(regex);
  if (matches) {
    content = content.replace(regex, pattern.replace('prisma.ticket', 'prisma'));
    console.log(`✅ Reemplazado ${matches.length} ocurrencias de ${pattern}`);
    totalReplacements += matches.length;
  }
});

// 3. Reemplazar prisma.cliente
const clienteMatches = content.match(/prisma\.cliente\./g);
if (clienteMatches) {
  content = content.replace(/prisma\.cliente\./g, 'prisma.');
  console.log(`✅ Reemplazado ${clienteMatches.length} ocurrencias de prisma.cliente`);
  totalReplacements += clienteMatches.length;
}

// 4. Reemplazar prisma.empleado
const empleadoMatches = content.match(/prisma\.empleado\./g);
if (empleadoMatches) {
  content = content.replace(/prisma\.empleado\./g, 'prisma.');
  console.log(`✅ Reemplazado ${empleadoMatches.length} ocurrencias de prisma.empleado`);
  totalReplacements += empleadoMatches.length;
}

// Escribir archivo actualizado
fs.writeFileSync(file, content);
console.log(`\n🎉 Actualización completada! Total de reemplazos: ${totalReplacements}`);
console.log('📁 Archivo actualizado: server/services/averiasService.js');