const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./prismaClient');

async function importarClientes() {
  console.log('🔄 Importando clientes desde CSV limpio...');
  
  const csvPath = path.join(__dirname, 'clientesCSV_limpio.csv');
  let processedCount = 0;
  let errorCount = 0;
  const errors = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'utf8' })
      .on('error', (error) => {
        console.error('❌ Error al leer archivo CSV:', error.message);
        reject(error);
      })
      .pipe(csv())
      .on('data', async (row) => {
        try {
          // Validaciones básicas
          if (!row.ID || !row.nombre || row.nombre.length < 2) {
            return;
          }

          const clienteData = {
            codigoCliente: `CLI-${row.ID}`,
            cedula: row.numero_documento && row.numero_documento.length > 0 ? row.numero_documento.substring(0, 50) : null,
            nombre: row.nombre.substring(0, 100),
            apellidos: row.apellidos && row.apellidos.length > 0 ? row.apellidos.substring(0, 100) : 'Sin apellidos',
            sector_barrio: row.Sector_Barrio ? row.Sector_Barrio.substring(0, 100) : null,
            direccion: row.Direccion ? row.Direccion.substring(0, 500) : null,
            telefono: row.Telefono ? row.Telefono.substring(0, 20) : null,
            email: row.Email ? row.Email.substring(0, 100) : null,
            sexo: row.Sexo === 'Masculino' ? 'MASCULINO' : 
                  row.Sexo === 'Femenino' ? 'FEMENINO' : 
                  'OTRO',
            tipoCliente: row.tipo_documento ? row.tipo_documento.toLowerCase().substring(0, 50) : 'residencial',
            categoria_cliente: row.categoria_cliente === 'Nuevo' ? 'NUEVO' :
                              row.categoria_cliente === 'Viejo' ? 'VIEJO' :
                              row.categoria_cliente === 'VIP' ? 'VIP' :
                              'NUEVO',
            estado: row.Estado === 'Activo' || row.Estado === 'activo' ? 'activo' : 'inactivo',
            notas: row.Nota_Estado ? row.Nota_Estado.substring(0, 500) : null,
          };

          // Parsear fecha
          if (row.Fecha_ingreso) {
            try {
              const fecha = new Date(row.Fecha_ingreso);
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

          if (processedCount % 20 === 0) {
            console.log(`✅ ${processedCount} clientes importados...`);
          }

        } catch (error) {
          errorCount++;
          if (errorCount <= 5) {
            errors.push(`Cliente ${row.ID}: ${error.message.substring(0, 60)}`);
          }
        }
      })
      .on('end', () => {
        console.log(`\n✅ Importación completada:`);
        console.log(`   Clientes importados: ${processedCount}`);
        console.log(`   Errores: ${errorCount}`);
        
        if (errors.length > 0) {
          console.log(`\n📋 Errores encontrados:`);
          errors.forEach(err => console.log(`   - ${err}`));
        }
        
        resolve({ processedCount, errorCount });
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
