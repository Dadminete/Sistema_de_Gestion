const fs = require('fs');
const path = require('path');
const readline = require('readline');
const prisma = require('./prismaClient');

async function importarClientes() {
  console.log('🔄 Importando clientes desde CSV (extrayendo datos de texto válido)...');
  
  const csvPath = path.join(__dirname, 'clientesCSV.csv');
  const fileStream = fs.createReadStream(csvPath, { encoding: 'latin1', highWaterMark: 16 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let processedCount = 0;
  let errorCount = 0;

  for await (const line of rl) {
    lineCount++;
    
    if (lineCount === 1) {
      console.log('⏳ Leyendo y procesando registros...\n');
      continue;
    }

    try {
      // Estrategia: buscar patrones de quoted fields
      // El formato es: "ID","tipo","numero","nombre","apellidos","sector",...
      const matches = line.match(/"([^"]*?)"/g);
      
      if (!matches || matches.length < 5) {
        continue;
      }

      // Extraer campos removiendo comillas
      const fields = matches.map(m => m.replace(/"/g, ''));
      
      const id = fields[0]?.trim();
      const tipo = fields[1]?.trim();
      const numero_doc = fields[2]?.trim();
      const nombre = fields[3]?.trim();
      const apellidos = fields[4]?.trim();
      const sector = fields[5]?.trim();
      const direccion = fields[6]?.trim();
      // Saltar coordenadas_gps (campo 7)
      const telefono = fields[8]?.trim();
      const contacto = fields[9]?.trim();
      const email = fields[10]?.trim();
      const sexo = fields[11]?.trim();
      const fecha = fields[12]?.trim();
      const dia_pago = fields[13]?.trim();
      const dia_corte = fields[14]?.trim();
      const categoria = fields[15]?.trim();
      const monto_total = fields[16]?.trim();
      const monto_servicios = fields[17]?.trim();
      // Saltar Imagen (campo 18) - datos binarios
      const referido = fields[19]?.trim();
      const estado = fields[20]?.trim();
      const nota = fields[21]?.trim();

      // Validaciones básicas
      if (!id || !nombre || nombre.length < 2) {
        continue;
      }

      // Validar que no sean datos binarios (caracteres de control)
      if (nombre.charCodeAt(0) < 32 || nombre.charCodeAt(0) > 127) {
        continue;
      }

      // Validar apellidos también
      if (apellidos && (apellidos.charCodeAt(0) < 32 || apellidos.charCodeAt(0) > 127)) {
        continue;
      }

      const clienteData = {
        codigoCliente: `CLI-${id}`,
        cedula: numero_doc && numero_doc.trim() ? numero_doc.substring(0, 50) : null,
        nombre: nombre.substring(0, 100),
        apellidos: apellidos ? apellidos.substring(0, 100) : 'Sin apellidos',
        sector_barrio: sector ? sector.substring(0, 100) : null,
        direccion: direccion ? direccion.substring(0, 500) : null,
        telefono: telefono ? telefono.substring(0, 20) : null,
        email: email && email.trim() ? email.substring(0, 100) : null,
        sexo: sexo === 'Masculino' ? 'MASCULINO' : 
              sexo === 'Femenino' ? 'FEMENINO' : 
              'OTRO',
        tipoCliente: tipo ? tipo.toLowerCase().substring(0, 50) : 'residencial',
        categoria_cliente: categoria === 'Nuevo' ? 'NUEVO' :
                          categoria === 'Viejo' ? 'VIEJO' :
                          categoria === 'VIP' ? 'VIP' :
                          'NUEVO',
        estado: estado === 'Activo' || estado === 'activo' ? 'activo' : 'inactivo',
        notas: nota ? nota.substring(0, 500) : null,
      };

      // Parsear fecha si existe
      if (fecha) {
        try {
          const fechaObj = new Date(fecha);
          if (!isNaN(fechaObj.getTime())) {
            clienteData.createdAt = fechaObj;
          }
        } catch (e) {
          // Ignorar fecha inválida
        }
      }

      // Crear cliente
      await prisma.cliente.create({ data: clienteData });

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`✅ ${processedCount} clientes importados...`);
      }

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.warn(`⚠️  Línea ${lineCount}: ${error.message.substring(0, 80)}`);
      }
    }

    // Mostrar progreso
    if (lineCount % 5000 === 0 && lineCount > 1) {
      console.log(`   📄 Procesadas ${lineCount} líneas del CSV...`);
    }
  }

  console.log(`\n✅ Importación completada:`);
  console.log(`   Total de líneas procesadas: ${lineCount}`);
  console.log(`   Clientes importados: ${processedCount}`);
  console.log(`   Errores: ${errorCount}`);

  return { processedCount, errorCount, totalLines: lineCount };
}

// Ejecutar
importarClientes()
  .then(result => {
    console.log('\n🎉 Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  });
