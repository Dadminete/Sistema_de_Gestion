const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const prisma = require('./prismaClient');

async function importarClientesLimpios() {
  console.log('🔄 Importando clientes desde CSV exportado...');
  
  const csvPath = path.join(__dirname, 'clientesCSV_exportado.csv');
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
          const clienteData = {
            codigoCliente: `CLI-${row.ID}`,
            cedula: null,
            nombre: row.nombre && row.nombre.length > 0 ? row.nombre.substring(0, 100) : 'Sin nombre',
            apellidos: row.apellidos && row.apellidos.length > 0 ? row.apellidos.substring(0, 100) : 'Sin apellidos',
            sector_barrio: null,
            direccion: row.Direccion && row.Direccion.length > 0 ? row.Direccion.substring(0, 500) : null,
            telefono: row.Telefono && row.Telefono.length > 0 ? row.Telefono.substring(0, 20) : null,
            email: null,
            sexo: row.Sexo === 'Masculino' ? 'MASCULINO' : 
                  row.Sexo === 'Femenino' ? 'FEMENINO' : 
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
importarClientesLimpios()
  .then(result => {
    console.log('\n🎉 Proceso finalizado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
