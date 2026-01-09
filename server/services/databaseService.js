const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();
const path = require('path');
const fs = require('fs');

const backupsDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

// Escape SQL strings to prevent injection and handle special characters
const escapeSQLValue = (value) => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  // Escape single quotes by doubling them
  return `'${value.toString().replace(/'/g, "''")}'`;
};

// Generate SQL INSERT statements from data
const generateInsertStatements = (tableName, data) => {
  if (!data || data.length === 0) {
    return `-- No data for table: ${tableName}\n`;
  }

  const columns = Object.keys(data[0]);
  let sql = `-- Data for table: ${tableName}\n`;
  
  for (const row of data) {
    const values = columns.map(col => escapeSQLValue(row[col])).join(', ');
    sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
  }
  
  return sql + '\n';
};

// Get table schema (CREATE TABLE statement)
const getTableSchema = async (tableName) => {
  try {
    // Get column information
    const columns = await prisma.$queryRawUnsafe(`
      SELECT 
        column_name, 
        data_type, 
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, tableName);

    // Get primary key information
    const primaryKeys = await prisma.$queryRawUnsafe(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary;
    `, tableName);

    // Get foreign key information
    const foreignKeys = await prisma.$queryRawUnsafe(`
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY';
    `, tableName);

    let createSQL = `-- Table: ${tableName}\n`;
    createSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
    createSQL += `CREATE TABLE ${tableName} (\n`;

    // Add columns
    const columnDefs = columns.map(col => {
      let def = `  ${col.column_name} ${col.data_type}`;
      
      if (col.character_maximum_length) {
        def += `(${col.character_maximum_length})`;
      }
      
      if (col.is_nullable === 'NO') {
        def += ' NOT NULL';
      }
      
      if (col.column_default) {
        def += ` DEFAULT ${col.column_default}`;
      }
      
      return def;
    });

    createSQL += columnDefs.join(',\n');

    // Add primary key
    if (primaryKeys.length > 0) {
      const pkColumns = primaryKeys.map(pk => pk.attname).join(', ');
      createSQL += `,\n  PRIMARY KEY (${pkColumns})`;
    }

    createSQL += '\n);\n\n';

    // Add foreign keys as ALTER TABLE statements
    if (foreignKeys.length > 0) {
      for (const fk of foreignKeys) {
        createSQL += `ALTER TABLE ${tableName} ADD CONSTRAINT ${fk.constraint_name} `;
        createSQL += `FOREIGN KEY (${fk.column_name}) `;
        createSQL += `REFERENCES ${fk.foreign_table_name} (${fk.foreign_column_name});\n`;
      }
      createSQL += '\n';
    }

    return createSQL;
  } catch (error) {
    console.warn(`Could not get schema for table ${tableName}:`, error.message);
    return `-- Could not retrieve schema for table: ${tableName}\n\n`;
  }
};

const createBackup = async (tables, isFullBackup) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = isFullBackup 
      ? `full-backup-${timestamp}.sql` 
      : `partial-backup-${timestamp}.sql`;
    const backupPath = path.join(backupsDir, backupFileName);

    console.log(`🔄 Creating ${isFullBackup ? 'full' : 'partial'} database backup...`);

    let sqlContent = `-- PostgreSQL Database Backup\n`;
    sqlContent += `-- Created: ${new Date().toISOString()}\n`;
    sqlContent += `-- Type: ${isFullBackup ? 'Full Backup' : 'Partial Backup'}\n\n`;
    sqlContent += `SET client_encoding = 'UTF8';\n`;
    sqlContent += `SET standard_conforming_strings = on;\n\n`;

    let tablesToBackup = tables;

    if (isFullBackup) {
      // Get all tables from the database - usar nombres reales de PostgreSQL
      const tablesResult = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;
      tablesToBackup = tablesResult.map(row => row.tablename);
      console.log(`📋 Found ${tablesToBackup.length} tables to backup`);
    } else {
      console.log(`📋 Backing up ${tablesToBackup.length} selected tables`);
      
      // Los nombres de tabla vienen del frontend, pueden estar en notación Prisma
      // Necesitamos convertirlos a los nombres reales de PostgreSQL
      // Por ahora, los convertimos a minúsculas (convención de Prisma)
      tablesToBackup = tablesToBackup.map(t => {
        // Convertir de notación Prisma (Cliente, Usuario) a PostgreSQL (clientes, usuarios)
        // La mayoría de tablas en Prisma están en plural y minúsculas
        const lowerTable = t.toLowerCase();
        // Si no termina en 's', agregarlo (Cliente -> clientes)
        return lowerTable.endsWith('s') ? lowerTable : lowerTable + 's';
      });
      console.log(`📋 Nombres de tabla convertidos: ${tablesToBackup.join(', ')}`);
    }

    // Backup each table
    for (const tableName of tablesToBackup) {
      try {
        console.log(`  📦 Backing up table: ${tableName}`);
        
        // Get table schema
        const schema = await getTableSchema(tableName);
        sqlContent += schema;

        // Get table data - usar nombre sin comillas para que PostgreSQL use minúsculas
        const data = await prisma.$queryRawUnsafe(`SELECT * FROM ${tableName};`);
        const inserts = generateInsertStatements(tableName, data);
        sqlContent += inserts;

        console.log(`  ✅ ${tableName}: ${data.length} rows`);
      } catch (err) {
        console.warn(`  ⚠️  Could not backup table ${tableName}:`, err.message);
        sqlContent += `-- Error backing up table ${tableName}: ${err.message}\n\n`;
      }
    }

    // Write backup file
    fs.writeFileSync(backupPath, sqlContent, 'utf8');

    console.log(`✅ Backup created successfully: ${backupPath}`);
    console.log(`📊 File size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);

    return backupPath;

  } catch (e) {
    console.error('❌ Backup creation error:', e);
    throw new Error('Backup failed: ' + e.message);
  }
};

const getBackups = async () => {
    try {
        // Ensure the backups directory exists
        if (!fs.existsSync(backupsDir)) {
            console.log('Backups directory does not exist, creating it...');
            fs.mkdirSync(backupsDir, { recursive: true });
            return []; // Return empty array if directory was just created
        }

        const backupFiles = fs.readdirSync(backupsDir);
        
        // Filter only .sql files
        const sqlFiles = backupFiles.filter(file => file.endsWith('.sql'));
        
        return sqlFiles.map(file => {
            const filePath = path.join(backupsDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                createdAt: stats.ctime,
            };
        });
    } catch (e) {
        console.error('Error in getBackups:', e);
        // Return empty array instead of throwing error
        return [];
    }
};

const getBackupPath = async (filename) => {
    const filePath = path.join(backupsDir, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error('Backup file not found');
    }
    return filePath;
};

const deleteBackup = async (filename) => {
    try {
        const filePath = path.join(backupsDir, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error('Backup file not found');
        }
        fs.unlinkSync(filePath);
        console.log(`Backup deleted: ${filename}`);
    } catch (e) {
        console.error(e);
        throw new Error('Could not delete backup');
    }
};


module.exports = {
  createBackup,
  getBackups,
  getBackupPath,
  deleteBackup,
};
