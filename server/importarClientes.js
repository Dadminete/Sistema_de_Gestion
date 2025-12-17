const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./prismaClient');

async function importarClientes() {
  console.log('🔄 Iniciando importación de clientes desde CSV...');
  
  // Usar el archivo final limpio
  const csvPath = path.join(__dirname, 'clientesCSV_final.csv');
  const results = [];
  let processedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'utf8' })
      .on('error', (error) => {
        console.error('❌ Error al leer archivo CSV:', error.message);
        reject(error);
      })
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        console.log(`📊 Total de registros en CSV: ${results.length}`);
        console.log('⏳ Procesando registros...\n');
        
        for (let i = 0; i < results.length; i++) {
          const cliente = results[i];
          try {
            // Filtrar registros vacíos
            if (!cliente.nombre || !cliente.nombre.trim() || !cliente.ID) {
              skippedCount++;
              continue;
            }

            // Validar que el nombre no contenga datos binarios
            if (cliente.nombre.charCodeAt(0) > 127 && cliente.nombre.length < 5) {
              skippedCount++;
              continue;
            }

            // Procesar y validar datos
            const clienteData = {
              codigoCliente: `CLI-${cliente.ID}`,
              cedula: cliente.numero_documento && cliente.numero_documento.trim() ? cliente.numero_documento.substring(0, 50) : null,
              nombre: cliente.nombre.substring(0, 100),
              apellidos: cliente.apellidos && cliente.apellidos.trim() ? cliente.apellidos.substring(0, 100) : 'Sin apellidos',
              telefono: cliente.Telefono && cliente.Telefono.trim() ? cliente.Telefono.substring(0, 20) : null,
              email: cliente.Email && cliente.Email.trim() ? cliente.Email.substring(0, 100) : null,
              direccion: cliente.Direccion && cliente.Direccion.trim() ? cliente.Direccion.substring(0, 500) : null,
              sector_barrio: cliente.Sector_Barrio && cliente.Sector_Barrio.trim() ? cliente.Sector_Barrio.substring(0, 100) : null,
              sexo: cliente.Sexo === 'Masculino' ? 'MASCULINO' : 
                    cliente.Sexo === 'Femenino' ? 'FEMENINO' : 
                    'OTRO',
              tipoCliente: cliente.tipo_documento ? cliente.tipo_documento.toLowerCase().substring(0, 50) : 'residencial',
              categoria_cliente: cliente.categoria_cliente === 'Nuevo' ? 'NUEVO' :
                                cliente.categoria_cliente === 'Viejo' ? 'VIEJO' :
                                cliente.categoria_cliente === 'VIP' ? 'VIP' :
                                'NUEVO',
              estado: cliente.Estado === 'Activo' || cliente.Estado === 'activo' ? 'activo' : 'inactivo',
              notas: cliente.Nota_Estado && cliente.Nota_Estado.trim() ? cliente.Nota_Estado.substring(0, 500) : null,
            };

            // Agregar fecha si existe y es válida
            if (cliente.Fecha_ingreso && cliente.Fecha_ingreso.trim()) {
              try {
                const fecha = new Date(cliente.Fecha_ingreso);
                if (!isNaN(fecha.getTime())) {
                  clienteData.createdAt = fecha;
                }
              } catch (e) {
                // Usar fecha actual si no se puede parsear
              }
            }

            // Crear cliente
            await prisma.cliente.create({
              data: clienteData
            });

            processedCount++;
            if (processedCount % 100 === 0) {
              console.log(`✅ ${processedCount} clientes importados... (Saltados: ${skippedCount})`);
            }
          } catch (error) {
            errorCount++;
            if (errorCount <= 10) {
              errors.push(`Cliente ${cliente.ID}: ${error.message.substring(0, 100)}`);
            }
          }
        }

        console.log(`\n✅ Importación completada:`);
        console.log(`   Total procesados: ${processedCount}`);
        console.log(`   Total saltados: ${skippedCount}`);
        console.log(`   Errores: ${errorCount}`);
        
        if (errors.length > 0) {
          console.log(`\n📋 Errores encontrados:`);
          errors.forEach(err => console.log(`   - ${err}`));
        }
        
        resolve({ processedCount, errorCount, skippedCount, total: results.length });
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
