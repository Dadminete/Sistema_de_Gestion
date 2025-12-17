const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'server', 'services');
const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('.js'));

console.log('🔧 Actualizando TODOS los servicios para usar PrismaRetry...\n');

let totalFiles = 0;
let totalReplacements = 0;

files.forEach(fileName => {
  const filePath = path.join(servicesDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Solo procesar archivos que usen prisma directamente
  if (!content.includes("const prisma = require('../prismaClient');")) {
    return;
  }
  
  console.log(`📝 Procesando: ${fileName}`);
  
  let fileReplacements = 0;
  
  // 1. Cambiar import
  const oldImport = "const prisma = require('../prismaClient');";
  const newImport = "const PrismaRetry = require('../prismaRetry');\nconst prisma = new PrismaRetry();";
  
  if (content.includes(oldImport)) {
    content = content.replace(oldImport, newImport);
    fileReplacements++;
  }
  
  // 2. Encontrar todos los modelos usados en el archivo
  const modelRegex = /prisma\.(\w+)\./g;
  const models = new Set();
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    models.add(match[1]);
  }
  
  // 3. Reemplazar cada modelo
  models.forEach(model => {
    const regex = new RegExp(`prisma\\.${model}\\.`, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, 'prisma.');
      console.log(`   ✅ ${model}: ${matches.length} ocurrencias`);
      fileReplacements += matches.length;
    }
  });
  
  // Escribir archivo actualizado si hubo cambios
  if (fileReplacements > 0) {
    fs.writeFileSync(filePath, content);
    totalFiles++;
    totalReplacements += fileReplacements;
    console.log(`   🎯 Total reemplazos en ${fileName}: ${fileReplacements}\n`);
  }
});

console.log(`🎉 Actualización completada!`);
console.log(`📁 Archivos actualizados: ${totalFiles}`);
console.log(`🔄 Total de reemplazos: ${totalReplacements}`);