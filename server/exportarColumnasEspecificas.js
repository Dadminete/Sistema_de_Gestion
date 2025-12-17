const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function extraerColumnasEspecificas() {
  console.log('🔄 Extrayendo columnas específicas del CSV...');
  
  const inputPath = path.join(__dirname, 'clientesCSV.csv');
  const outputPath = path.join(__dirname, 'clientesCSV_exportado.csv');
  
  const fileStream = fs.createReadStream(inputPath, { encoding: 'latin1', highWaterMark: 64 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  
  let lineCount = 0;
  let validCount = 0;
  const columnIndices = {
    nombre: -1,
    apellidos: -1,
    direccion: -1,
    telefono: -1,
    sexo: -1,
    id: -1
  };

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      // Procesar header y encontrar índices de las columnas
      const headers = [];
      let current = '';
      let inQuotes = false;
      let fieldIndex = 0;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          const headerClean = current.toLowerCase().replace(/"/g, '').trim();
          
          if (headerClean === 'id') columnIndices.id = fieldIndex;
          else if (headerClean === 'nombre') columnIndices.nombre = fieldIndex;
          else if (headerClean === 'apellidos') columnIndices.apellidos = fieldIndex;
          else if (headerClean === 'direccion') columnIndices.direccion = fieldIndex;
          else if (headerClean === 'telefono') columnIndices.telefono = fieldIndex;
          else if (headerClean === 'sexo') columnIndices.sexo = fieldIndex;
          
          headers.push(headerClean);
          current = '';
          fieldIndex++;
        } else {
          current += char;
        }
      }
      
      const headerClean = current.toLowerCase().replace(/"/g, '').trim();
      if (headerClean === 'id') columnIndices.id = fieldIndex;
      else if (headerClean === 'nombre') columnIndices.nombre = fieldIndex;
      else if (headerClean === 'apellidos') columnIndices.apellidos = fieldIndex;
      else if (headerClean === 'direccion') columnIndices.direccion = fieldIndex;
      else if (headerClean === 'telefono') columnIndices.telefono = fieldIndex;
      else if (headerClean === 'sexo') columnIndices.sexo = fieldIndex;

      console.log('📋 Índices encontrados:');
      console.log(`   ID: ${columnIndices.id}`);
      console.log(`   Nombre: ${columnIndices.nombre}`);
      console.log(`   Apellidos: ${columnIndices.apellidos}`);
      console.log(`   Dirección: ${columnIndices.direccion}`);
      console.log(`   Teléfono: ${columnIndices.telefono}`);
      console.log(`   Sexo: ${columnIndices.sexo}`);

      // Escribir header del archivo exportado
      writeStream.write('"ID","nombre","apellidos","Direccion","Telefono","Sexo"\n');
      continue;
    }

    try {
      // Parsear campos de la línea
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
          fields.push(current.replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.replace(/^"|"$/g, ''));

      // Validar que tenga suficientes campos
      if (fields.length < Math.max(columnIndices.id, columnIndices.nombre, columnIndices.apellidos, 
                                   columnIndices.direccion, columnIndices.telefono, columnIndices.sexo) + 1) {
        continue;
      }

      // Extraer columnas específicas
      const id = fields[columnIndices.id]?.trim() || '';
      const nombre = fields[columnIndices.nombre]?.trim() || '';
      const apellidos = fields[columnIndices.apellidos]?.trim() || '';
      const direccion = fields[columnIndices.direccion]?.trim() || '';
      const telefono = fields[columnIndices.telefono]?.trim() || '';
      const sexo = fields[columnIndices.sexo]?.trim() || '';

      // Validar datos
      if (!id || !nombre || nombre.length < 2) {
        continue;
      }

      // Validar que no sean datos binarios
      if (nombre.charCodeAt(0) < 32 || nombre.charCodeAt(0) > 126) {
        continue;
      }

      // Escapar comillas y escribir línea
      const escapedNombre = nombre.replace(/"/g, '""');
      const escapedApellidos = apellidos.replace(/"/g, '""');
      const escapedDireccion = direccion.replace(/"/g, '""');
      const escapedTelefono = telefono.replace(/"/g, '""');

      writeStream.write(`"${id}","${escapedNombre}","${escapedApellidos}","${escapedDireccion}","${escapedTelefono}","${sexo}"\n`);
      validCount++;

      if (validCount % 100 === 0) {
        console.log(`   ✅ ${validCount} registros procesados...`);
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
      console.log(`   Registros exportados: ${validCount}`);
      console.log(`   Archivo guardado: ${outputPath}`);
      resolve(validCount);
    });
  });
}

extraerColumnasEspecificas()
  .then(count => {
    console.log('\n🎉 Extracción completada exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
