const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'server', 'services');

// Funciones de conversión
const conversions = [
  // Convertir de sintaxis estática a proxy
  {
    pattern: /prisma\.findMany\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.findMany($2)'
  },
  {
    pattern: /prisma\.findFirst\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.findFirst($2)'
  },
  {
    pattern: /prisma\.findUnique\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.findUnique($2)'
  },
  {
    pattern: /prisma\.create\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.create($2)'
  },
  {
    pattern: /prisma\.update\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.update($2)'
  },
  {
    pattern: /prisma\.delete\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.delete($2)'
  },
  {
    pattern: /prisma\.deleteMany\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.deleteMany($2)'
  },
  {
    pattern: /prisma\.updateMany\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.updateMany($2)'
  },
  {
    pattern: /prisma\.count\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.count($2)'
  },
  {
    pattern: /prisma\.aggregate\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.aggregate($2)'
  },
  {
    pattern: /prisma\.groupBy\('(\w+)',\s*([^)]+)\)/g,
    replacement: 'prisma.$1.groupBy($2)'
  },
  // Casos donde no hay argumentos
  {
    pattern: /prisma\.findMany\('(\w+)'\)/g,
    replacement: 'prisma.$1.findMany()'
  },
  {
    pattern: /prisma\.count\('(\w+)'\)/g,
    replacement: 'prisma.$1.count()'
  }
];

let totalReplacements = 0;
let processedFiles = 0;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;

    // Aplicar todas las conversiones
    conversions.forEach(conversion => {
      const matches = content.match(conversion.pattern);
      if (matches) {
        content = content.replace(conversion.pattern, conversion.replacement);
        fileReplacements += matches.length;
      }
    });

    // Si hubo cambios, escribir el archivo
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.basename(filePath)}: ${fileReplacements} reemplazos`);
      totalReplacements += fileReplacements;
      processedFiles++;
    }

  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

console.log('🔄 Corrigiendo sintaxis de PrismaRetry en servicios...\n');

// Procesar todos los archivos .js en el directorio de servicios
const files = fs.readdirSync(servicesDir);
files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(servicesDir, file);
    processFile(filePath);
  }
});

console.log(`\n📊 Resumen:`);
console.log(`   Archivos procesados: ${processedFiles}`);
console.log(`   Total de reemplazos: ${totalReplacements}`);
console.log(`\n🎉 ¡Corrección de sintaxis completada!`);