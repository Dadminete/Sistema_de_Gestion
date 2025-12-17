const fs = require('fs');
const path = require('path');
const readline = require('readline');
const prisma = require('./prismaClient');

async function importarClientesLimpios() {
  console.log('🔄 Importando clientes desde CSV exportado...');
  
  const csvPath = path.join(__dirname, 'clientesCSV_exportado.csv');
  
  const fileStream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let processedCount = 0;
  let errorCount = 0;
  const errors = [];

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      console.log('⏳ Leyendo registros...\n');
      continue;
    }

    try {
      // Parsear CSV simple con comillas
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

      if (fields.length < 6) continue;

      const id = fields[0];
      const nombre = fields[1];
      const apellidos = fields[2];
      const direccion = fields[3];
      const telefono = fields[4];
      const sexo = fields[5];

      // Validar datos
      if (!id || !nombre || nombre.length < 2) {
        continue;
      }

      const clienteData = {
        codigoCliente: `CLI-${new Date().getFullYear()}-${String(processedCount + 1).padStart(4, '0')}`,
        cedula: null,
        nombre: nombre.substring(0, 100),
        apellidos: apellidos && apellidos.length > 0 ? apellidos.substring(0, 100) : 'Sin apellidos',
        sector_barrio: null,
        direccion: direccion && direccion.length > 0 ? direccion.substring(0, 500) : null,
        telefono: telefono && telefono.length > 0 ? telefono.substring(0, 20) : null,
        email: null,
        sexo: sexo === 'Masculino' ? 'MASCULINO' : 
              sexo === 'Femenino' ? 'FEMENINO' : 
              'OTRO',
        tipoCliente: 'residencial',
        categoria_cliente: 'NUEVO',
        estado: 'activo',
        notas: null,
      };

      // Crear cliente
      await prisma.cliente.create({ data: clienteData });
      processedCount++;

      if (processedCount % 20 === 0) {
        console.log(`✅ ${processedCount} clientes importados...`);
      }

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        errors.push(`Línea ${lineCount}: ${error.message.substring(0, 60)}`);
      }
    }
  }

  console.log(`\n✅ Importación completada:`);
  console.log(`   Clientes importados: ${processedCount}`);
  console.log(`   Errores: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log(`\n📋 Errores encontrados:`);
    errors.forEach(err => console.log(`   - ${err}`));
  }

  return { processedCount, errorCount };
}

// Ejecutar
importarClientesLimpios()
  .then(result => {
    console.log('\n🎉 Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
