const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();
const path = require('path');
const fs = require('fs');

const backupsDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir);
}

const createBackup = async (tables, isFullBackup) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let backupPath;

    if (isFullBackup) {
      // Full backup - backup all tables
      backupPath = path.join(backupsDir, `full-backup-${timestamp}.sql`);

      // Get all table names from the database
      const tablesResult = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `;

      const allTables = tablesResult.map(row => row.tablename);

      // Create backup for all tables
      const backupData = {};
      for (const table of allTables) {
        try {
          const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}";`);
          backupData[table] = data;
        } catch (err) {
          console.warn(`Could not backup table ${table}:`, err.message);
        }
      }

      // Write backup file
      const backupContent = JSON.stringify({
        type: 'full',
        timestamp: new Date().toISOString(),
        tables: allTables,
        data: backupData
      }, null, 2);

      fs.writeFileSync(backupPath, backupContent);

    } else {
      // Partial backup - backup selected tables
      backupPath = path.join(backupsDir, `partial-backup-${timestamp}.sql`);

      const backupData = {};
      for (const table of tables) {
        try {
          const data = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}";`);
          backupData[table] = data;
        } catch (err) {
          console.warn(`Could not backup table ${table}:`, err.message);
        }
      }

      // Write backup file
      const backupContent = JSON.stringify({
        type: 'partial',
        timestamp: new Date().toISOString(),
        tables: tables,
        data: backupData
      }, null, 2);

      fs.writeFileSync(backupPath, backupContent);
    }

    console.log(`Backup created successfully: ${backupPath}`);
    return backupPath;

  } catch (e) {
    console.error('Backup creation error:', e);
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
