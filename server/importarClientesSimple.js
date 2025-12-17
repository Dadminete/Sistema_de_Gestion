const fs = require('fs');
const path = require('path');
const readline = require('readline');
const prisma = require('./prismaClient');

async function importarClientes() {
  console.log('🔄 Iniciando importación de clientes desde CSV (ignorando imágenes)...');
  
  const csvPath = path.join(__dirname, 'clientesCSV.csv');
  
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8', highWaterMark: 64 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let processedCount = 0;
  let errorCount = 0;
  let headerLine = null;
  let imageColIndex = -1;
  const errors = [];

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      // Procesar header para encontrar columna de imágenes
      headerLine = line;
      const headers = extractCSVHeaders(line);
      imageColIndex = headers.indexOf('Imagen');
      console.log(`📋 Total de columnas: ${headers.length}`);
      console.log(`   Columna Imagen en índice: ${imageColIndex}`);
      console.log('⏳ Leyendo y procesando registros...\n');
      continue;
    }

    try {
      const fields = extractCSVFields(line, imageColIndex);
      
      if (!fields || fields.length < 3) {
        continue;
      }

      // Extraer datos - ajustar índices si es necesario
      const id = fields[0] ? fields[0].trim() : null;
      const nombre = fields[3] ? fields[3].trim() : null;
      const apellidos = fields[4] ? fields[4].trim() : '';

      // Saltar registros vacíos
      if (!id || !nombre) {
        continue;
      }

      // Validar que no sean datos binarios
      if (nombre.length > 2 && nombre.charCodeAt(0) < 32) {
        continue;
      }

      const clienteData = {
        codigoCliente: `CLI-${id}`,
        cedula: fields[2] ? fields[2].trim().substring(0, 50) : null,
        nombre: nombre.substring(0, 100),
        apellidos: apellidos.substring(0, 100) || 'Sin apellidos',
        sector_barrio: fields[5] ? fields[5].trim().substring(0, 100) : null,
        direccion: fields[6] ? fields[6].trim().substring(0, 500) : null,
        telefono: fields[8] ? fields[8].trim().substring(0, 20) : null,
        email: fields[10] ? fields[10].trim().substring(0, 100) : null,
        sexo: fields[11] === 'Masculino' ? 'MASCULINO' : 
              fields[11] === 'Femenino' ? 'FEMENINO' : 
              'OTRO',
        tipoCliente: fields[1] ? fields[1].trim().toLowerCase().substring(0, 50) : 'residencial',
        categoria_cliente: fields[15] === 'Nuevo' ? 'NUEVO' :
                          fields[15] === 'Viejo' ? 'VIEJO' :
                          fields[15] === 'VIP' ? 'VIP' :
                          'NUEVO',
        estado: fields[20] === 'Activo' || fields[20] === 'activo' ? 'activo' : 'inactivo',
        notas: fields[21] ? fields[21].trim().substring(0, 500) : null,
      };

      // Parsear fecha
      if (fields[12] && fields[12].trim()) {
        try {
          const fecha = new Date(fields[12].trim());
          if (!isNaN(fecha.getTime())) {
            clienteData.createdAt = fecha;
          }
        } catch (e) {
          // Ignorar fecha inválida
        }
      }

      // Crear cliente en BD
      await prisma.cliente.create({ data: clienteData });

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`✅ ${processedCount} clientes importados...`);
      }

    } catch (error) {
      errorCount++;
      if (errorCount <= 10) {
        errors.push(`Línea ${lineCount}: ${error.message.substring(0, 80)}`);
      }
    }

    // Mostrar progreso cada 1000 líneas
    if (lineCount % 1000 === 0) {
      console.log(`   📄 Procesadas ${lineCount} líneas (${processedCount} registros válidos)...`);
    }
  }

  console.log(`\n✅ Importación completada:`);
  console.log(`   Total de líneas procesadas: ${lineCount}`);
  console.log(`   Clientes importados: ${processedCount}`);
  console.log(`   Errores: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log(`\n📋 Primeros errores encontrados:`);
    errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
  }

  return { processedCount, errorCount, totalLines: lineCount };
}

// Extrae headers del CSV ignorando la columna Imagen
function extractCSVHeaders(line) {
  const headers = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      headers.push(current.replace(/^"|"$/g, '').trim());
      current = '';
    } else {
      current += char;
    }
  }

  headers.push(current.replace(/^"|"$/g, '').trim());
  return headers;
}

// Extrae campos del CSV ignorando la columna Imagen
function extractCSVFields(line, imageColIndex) {
  const fields = [];
  let current = '';
  let insideQuotes = false;
  let fieldIndex = 0;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // Agregar campo solo si NO es la columna de imágenes
      if (fieldIndex !== imageColIndex) {
        fields.push(current.replace(/^"|"$/g, '').trim());
      }
      current = '';
      fieldIndex++;
    } else {
      current += char;
    }
  }

  // Último campo
  if (fieldIndex !== imageColIndex) {
    fields.push(current.replace(/^"|"$/g, '').trim());
  }

  return fields;
}

// Ejecutar
importarClientes()
  .then(result => {
    console.log('\n🎉 Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
