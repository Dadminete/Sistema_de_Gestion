const fs = require('fs');
const path = require('path');

// Leer el archivo
const filePath = path.join(__dirname, 'server', 'services', 'cajaService.js');
let content = fs.readFileSync(filePath, 'utf8');

// Mapeo de métodos de Prisma a PrismaRetry
const methodMap = {
  'findMany': 'findMany',
  'findFirst': 'findFirst',
  'findUnique': 'findUnique',
  'count': 'count',
  'aggregate': 'aggregate',
  'create': 'create',
  'update': 'update',
  'delete': 'delete',
  'groupBy': 'groupBy'
};

// Reemplazar prisma.modelo.método con PrismaRetry.método('modelo', ...)
Object.keys(methodMap).forEach(method => {
  const regex = new RegExp(`prisma\\.(\\w+)\\.${method}\\(`, 'g');
  content = content.replace(regex, `PrismaRetry.${methodMap[method]}('$1', `);
});

// Escribir el archivo actualizado
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Archivo cajaService.js actualizado con PrismaRetry');