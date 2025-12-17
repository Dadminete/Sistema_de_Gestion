const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function cleanCSV() {
  console.log('🔄 Limpiando CSV y eliminando columnas problemáticas...');
  
  const inputPath = path.join(__dirname, 'clientesCSV_clean.csv');
  const outputPath = path.join(__dirname, 'clientesCSV_final.csv');
  
  const fileStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  let lineCount = 0;
  let validCount = 0;
  let headerLine = null;
  let imageColIndex = -1;
  let coordenadasColIndex = -1;

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      // Procesar header
      headerLine = line;
      const headers = parseCSVLine(line);
      
      // Encontrar índices de columnas a eliminar
      imageColIndex = headers.indexOf('Imagen');
      coordenadasColIndex = headers.indexOf('coordenadas_gps');
      
      // Eliminar columnas
      const newHeaders = headers.filter((_, i) => i !== imageColIndex && i !== coordenadasColIndex);
      writeStream.write(newHeaders.map(h => `"${h}"`).join(',') + '\n');
      console.log(`📋 Headers: ${newHeaders.length} columnas`);
      console.log(`   Eliminada: Imagen (índice ${imageColIndex}), coordenadas_gps (índice ${coordenadasColIndex})`);
      continue;
    }

    try {
      const fields = parseCSVLine(line);
      
      // Filtrar campos vacíos o corrupto
      if (fields.length > 3 && fields[3] && fields[3].trim()) {
        // Eliminar las mismas columnas del datos
        const newFields = fields
          .filter((_, i) => i !== imageColIndex && i !== coordenadasColIndex)
          .map(f => {
            // Escapar comillas y envolver en comillas
            if (f === null || f === undefined) return '';
            const str = f.toString().replace(/"/g, '""');
            return `"${str}"`;
          });
        
        writeStream.write(newFields.join(',') + '\n');
        validCount++;
        
        if (validCount % 5000 === 0) {
          console.log(`   ✅ ${validCount} registros válidos procesados...`);
        }
      }
    } catch (e) {
      // Saltar línea corrupta
    }
  }

  writeStream.end();

  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log(`\n✅ Limpieza completada:`);
      console.log(`   Total líneas leídas: ${lineCount}`);
      console.log(`   Registros válidos: ${validCount}`);
      console.log(`   Archivo guardado en: ${outputPath}`);
      resolve(validCount);
    });
  });
}

// Parser CSV simple que maneja campos entre comillas
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  fields.push(current.trim());

  return fields;
}

// Ejecutar
cleanCSV()
  .then(() => {
    console.log('\n🎉 Proceso de limpieza finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
