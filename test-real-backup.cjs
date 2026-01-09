const databaseService = require('./server/services/databaseService');

async function testRealBackup() {
  try {
    console.log('🔄 Creando backup de prueba solo de Cliente...\n');
    
    const backupPath = await databaseService.createBackup(['cliente'], false);
    
    console.log('\n✅ Backup creado exitosamente!');
    console.log(`📁 Archivo: ${backupPath}`);
    
    // Leer el archivo y buscar a Ines Abad
    const fs = require('fs');
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    
    if (backupContent.includes('Ines') && backupContent.includes('Abad')) {
      console.log('\n✅✅ CONFIRMADO: Ines Abad ESTÁ incluida en el backup!');
      
      // Contar cuántas veces aparece
      const matches = backupContent.match(/Ines.*Abad/gi);
      console.log(`   Se encontró ${matches ? matches.length : 0} vez(ces) en el archivo`);
    } else {
      console.log('\n❌ Ines Abad NO está en el backup');
    }
    
    // Contar total de INSERT statements
    const inserts = backupContent.match(/INSERT INTO/g);
    console.log(`\n📊 Total de registros en el backup: ${inserts ? inserts.length : 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRealBackup();
