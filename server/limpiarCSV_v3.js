const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function limpiarCSV() {
  console.log('🔄 Limpiando CSV - eliminando columna Imagen...');
  
  const inputPath = path.join(__dirname, 'clientesCSV.csv');
  const outputPath = path.join(__dirname, 'clientesCSV_limpio.csv');
  
  const fileStream = fs.createReadStream(inputPath, { encoding: 'latin1' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  let lineCount = 0;
  let imageColIndex = -1;
  const validLines = [];

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      // Procesar header
      const parts = [];
      let current = '';
      let inQuotes = false;
      let quoteCount = 0;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
          quoteCount++;
        } else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);

      // Encontrar índice de Imagen
      imageColIndex = parts.findIndex(p => p.includes('Imagen'));
      console.log(`📋 Total columnas: ${parts.length}`);
      console.log(`   Imagen está en índice: ${imageColIndex}`);

      // Escribir header sin columna Imagen
      const newParts = parts.filter((_, i) => i !== imageColIndex);
      writeStream.write(newParts.join(',') + '\n');
      continue;
    }

    // Procesar data - parse CSV simple
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);

    // Saltar si no tiene suficientes campos
    if (parts.length < 10) continue;

    // Filtrar columna Imagen
    const newParts = parts.filter((_, i) => i !== imageColIndex);
    
    // Escribir línea
    writeStream.write(newParts.join(',') + '\n');
    validLines.push(lineCount);
  }

  writeStream.end();

  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log(`\n✅ CSV limpiado:`);
      console.log(`   Total líneas procesadas: ${lineCount}`);
      console.log(`   Líneas válidas: ${validLines.length}`);
      console.log(`   Archivo guardado: ${outputPath}`);
      resolve(validLines.length);
    });
  });
}

limpiarCSV()
  .then(() => {
    console.log('\n🎉 Limpieza completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
