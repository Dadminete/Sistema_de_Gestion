const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./prismaClient');

async function importarClientes() {
  console.log('🔄 Importando clientes desde CSV con csv-parser...');
  
  const csvPath = path.join(__dirname, 'clientesCSV.csv');
  let processedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'latin1' })
      .on('error', (error) => {
        console.error('❌ Error al leer archivo CSV:', error.message);
        reject(error);
      })
      .pipe(csv({
        // Mapear columnas con sus índices correctos
        headers: [
          'ID', 'tipo_documento', 'numero_documento', 'nombre', 'apellidos',
          'sector_barrio', 'direccion', 'coordenadas_gps', 'telefono', 'contacto',
          'email', 'sexo', 'fecha_ingreso', 'dia_pago', 'dia_corte', 'categoria_cliente',
          'monto_total', 'monto_servicios', 'imagen', 'referido', 'estado', 'nota_estado',
          'reactivado', 'usuario_id', 'zona_cobertura_id', 'plan_internet_id'
        ],
        skipLines: 1, // Saltar header original
        trim: true,
        mapValues: ({ value }) => value ? value.trim() : null
      }))
      .on('data', async (row) => {
        try {
          // Validaciones básicas
          if (!row.ID || !row.nombre || row.nombre.length < 2) {
            skippedCount++;
            return;
          }

          // Validar que no sean datos binarios
          if (row.nombre.charCodeAt(0) < 32 || row.nombre.charCodeAt(0) > 127) {
            skippedCount++;
            return;
          }

          const clienteData = {
            codigoCliente: `CLI-${row.ID}`,
            cedula: row.numero_documento && row.numero_documento.length > 0 ? row.numero_documento.substring(0, 50) : null,
            nombre: row.nombre.substring(0, 100),
            apellidos: row.apellidos && row.apellidos.length > 0 ? row.apellidos.substring(0, 100) : 'Sin apellidos',
            sector_barrio: row.sector_barrio ? row.sector_barrio.substring(0, 100) : null,
            direccion: row.direccion ? row.direccion.substring(0, 500) : null,
            telefono: row.telefono ? row.telefono.substring(0, 20) : null,
            email: row.email ? row.email.substring(0, 100) : null,
            sexo: row.sexo === 'Masculino' ? 'MASCULINO' : 
                  row.sexo === 'Femenino' ? 'FEMENINO' : 
                  'OTRO',
            tipoCliente: row.tipo_documento ? row.tipo_documento.toLowerCase().substring(0, 50) : 'residencial',
            categoria_cliente: row.categoria_cliente === 'Nuevo' ? 'NUEVO' :
                              row.categoria_cliente === 'Viejo' ? 'VIEJO' :
                              row.categoria_cliente === 'VIP' ? 'VIP' :
                              'NUEVO',
            estado: row.estado === 'Activo' || row.estado === 'activo' ? 'activo' : 'inactivo',
            notas: row.nota_estado ? row.nota_estado.substring(0, 500) : null,
          };

          // Parsear fecha
          if (row.fecha_ingreso) {
            try {
              const fecha = new Date(row.fecha_ingreso);
              if (!isNaN(fecha.getTime())) {
                clienteData.createdAt = fecha;
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
          if (errorCount <= 10) {
            errors.push(`Fila ${row.ID}: ${error.message.substring(0, 80)}`);
          }
        }
      })
      .on('end', () => {
        console.log(`\n✅ Importación completada:`);
        console.log(`   Clientes importados: ${processedCount}`);
        console.log(`   Total saltados: ${skippedCount}`);
        console.log(`   Errores: ${errorCount}`);
        
        if (errors.length > 0) {
          console.log(`\n📋 Errores encontrados:`);
          errors.forEach(err => console.log(`   - ${err}`));
        }
        
        resolve({ processedCount, errorCount, skippedCount });
      })
      .on('error', (error) => {
        console.error('❌ Error al procesar CSV:', error);
        reject(error);
      });
  });
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
