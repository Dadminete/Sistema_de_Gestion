const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function extraerCSVLimpio() {
  console.log('🔄 Extrayendo CSV - eliminando líneas con datos binarios...');
  
  const inputPath = path.join(__dirname, 'clientesCSV.csv');
  const outputPath = path.join(__dirname, 'clientesCSV_extraido.csv');
  
  const fileStream = fs.createReadStream(inputPath, { encoding: 'latin1', highWaterMark: 64 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  let lineCount = 0;
  let validCount = 0;
  let binaryLineCount = 0;
  let imageColIndex = -1;

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      // Procesar header y encontrar Imagen
      const headerFields = [];
      let current = '';
      let inQuotes = false;
      let fieldIndex = 0;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          if (current.includes('Imagen')) {
            imageColIndex = fieldIndex;
          }
          headerFields.push(current);
          current = '';
          fieldIndex++;
        } else {
          current += char;
        }
      }
      if (current.includes('Imagen')) {
        imageColIndex = fieldIndex;
      }
      headerFields.push(current);

      console.log(`📋 Total columnas: ${headerFields.length}`);
      console.log(`   Imagen en índice: ${imageColIndex}`);

      // Escribir header sin Imagen
      const newHeaders = headerFields.filter((_, i) => i !== imageColIndex);
      writeStream.write(newHeaders.join(',') + '\n');
      continue;
    }

    try {
      // Detectar si la línea contiene datos binarios (caracteres < 32 o > 126)
      let hasBinary = false;
      for (let i = 0; i < line.length; i++) {
        const code = line.charCodeAt(i);
        // Permitir solo caracteres válidos (32-126), más saltos de línea (10, 13) y comillas (34)
        if (code < 9 || (code > 13 && code < 32) || (code > 126 && code < 160)) {
          hasBinary = true;
          break;
        }
      }

      if (hasBinary) {
        binaryLineCount++;
        continue;
      }

      // Parsear campos
      const fields = [];
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
          fields.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current);

      if (fields.length < 5) continue;

      // Filtrar columna Imagen
      const newFields = fields.filter((_, i) => i !== imageColIndex);
      
      writeStream.write(newFields.join(',') + '\n');
      validCount++;

      if (validCount % 1000 === 0) {
        console.log(`   ✅ ${validCount} líneas válidas procesadas...`);
      }

    } catch (e) {
      // Ignorar líneas con error
    }
  }

  writeStream.end();

  return new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log(`\n✅ Extracción completada:`);
      console.log(`   Total líneas leídas: ${lineCount}`);
      console.log(`   Líneas válidas: ${validCount}`);
      console.log(`   Líneas con datos binarios: ${binaryLineCount}`);
      console.log(`   Archivo guardado: ${outputPath}`);
      resolve(validCount);
    });
  });
}

extraerCSVLimpio()
  .then(() => {
    console.log('\n🎉 Extracción completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
