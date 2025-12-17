const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'clientesCSV.csv');

// Leer el archivo como buffer
const buffer = fs.readFileSync(csvPath);

// Intentar decodificar con diferentes métodos
let content;
try {
  // Intenta UTF-8 primero
  content = buffer.toString('utf8');
  
  // Verifica si hay caracteres de reemplazo (indicativo de decodificación fallida)
  if (content.includes('\ufffd')) {
    // Intenta Latin1
    content = buffer.toString('latin1');
  }
} catch (e) {
  content = buffer.toString('binary');
}

// Limpiar contenido
const lines = content.split('\n');
console.log(`📊 Total de líneas: ${lines.length}`);
console.log(`\n📋 Primeras 3 líneas:\n`);
console.log(lines[0]);
console.log(lines[1]);
console.log(lines[2]);

// Guardar limpio en UTF-8
const cleanPath = path.join(__dirname, 'clientesCSV_clean.csv');
fs.writeFileSync(cleanPath, content, 'utf8');
console.log(`\n✅ Archivo limpio guardado en: ${cleanPath}`);

