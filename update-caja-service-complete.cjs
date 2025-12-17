const fs = require('fs');
const path = require('path');

// Leer el archivo
const filePath = path.join(__dirname, 'server', 'services', 'cajaService.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔄 Actualizando cajaService.js para usar PrismaRetry...');

// Reemplazos específicos y completos
const replacements = [
  // Reemplazos básicos
  ['prisma.caja.findMany(', 'PrismaRetry.findMany(\'caja\', '],
  ['prisma.caja.findFirst(', 'PrismaRetry.findFirst(\'caja\', '],
  ['prisma.caja.findUnique(', 'PrismaRetry.findUnique(\'caja\', '],
  ['prisma.caja.count(', 'PrismaRetry.count(\'caja\', '],
  ['prisma.caja.create(', 'PrismaRetry.create(\'caja\', '],
  ['prisma.caja.update(', 'PrismaRetry.update(\'caja\', '],
  ['prisma.caja.delete(', 'PrismaRetry.delete(\'caja\', '],
  
  // Otros modelos
  ['prisma.movimientoContable.findMany(', 'PrismaRetry.findMany(\'movimientoContable\', '],
  ['prisma.movimientoContable.aggregate(', 'PrismaRetry.aggregate(\'movimientoContable\', '],
  ['prisma.movimientoContable.groupBy(', 'PrismaRetry.groupBy(\'movimientoContable\', '],
  
  ['prisma.aperturaCaja.findFirst(', 'PrismaRetry.findFirst(\'aperturaCaja\', '],
  ['prisma.aperturaCaja.findMany(', 'PrismaRetry.findMany(\'aperturaCaja\', '],
  ['prisma.aperturaCaja.create(', 'PrismaRetry.create(\'aperturaCaja\', '],
  
  ['prisma.cierreCaja.findFirst(', 'PrismaRetry.findFirst(\'cierreCaja\', '],
  ['prisma.cierreCaja.findMany(', 'PrismaRetry.findMany(\'cierreCaja\', '],
  ['prisma.cierreCaja.create(', 'PrismaRetry.create(\'cierreCaja\', '],
  ['prisma.cierreCaja.count(', 'PrismaRetry.count(\'cierreCaja\', '],
  
  ['prisma.cuentaContable.findUnique(', 'PrismaRetry.findUnique(\'cuentaContable\', '],
  ['prisma.cuentaContable.update(', 'PrismaRetry.update(\'cuentaContable\', '],
  
  ['prisma.categoriaCuenta.findFirst(', 'PrismaRetry.findFirst(\'categoriaCuenta\', '],
  
  ['prisma.cliente.count(', 'PrismaRetry.count(\'cliente\', '],
  
  ['prisma.facturaCliente.aggregate(', 'PrismaRetry.aggregate(\'facturaCliente\', '],
  
  ['prisma.pagoCliente.aggregate(', 'PrismaRetry.aggregate(\'pagoCliente\', '],
  ['prisma.pagoCliente.findMany(', 'PrismaRetry.findMany(\'pagoCliente\', '],
  
  ['prisma.suscripcion.aggregate(', 'PrismaRetry.aggregate(\'suscripcion\', '],
  
  ['prisma.evento.findMany(', 'PrismaRetry.findMany(\'evento\', '],
  ['prisma.tarea.findMany(', 'PrismaRetry.findMany(\'tarea\', ']
];

// Aplicar todos los reemplazos
replacements.forEach(([oldText, newText]) => {
  const oldCount = (content.match(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
  const newCount = (content.match(new RegExp(newText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  
  if (oldCount > 0) {
    console.log(`   ✅ Reemplazado ${oldCount} ocurrencias de "${oldText}"`);
  }
});

// Escribir el archivo actualizado
fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 Archivo cajaService.js actualizado exitosamente con PrismaRetry!');

// Verificar si quedan llamadas directas a prisma
const remainingPrismaCalls = (content.match(/prisma\.\w+\.\w+\(/g) || []);
if (remainingPrismaCalls.length > 0) {
  console.log('⚠️  Llamadas directas a prisma que pueden necesitar actualización:');
  const uniqueCalls = [...new Set(remainingPrismaCalls)];
  uniqueCalls.forEach(call => console.log(`   - ${call}`));
} else {
  console.log('✨ No se encontraron más llamadas directas a prisma!');
}