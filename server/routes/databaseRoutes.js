const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const { authenticateToken } = require('../middleware/authMiddleware');

// POST /api/database/backup
router.post('/backup', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Backup request received:', req.body);
    const { tables, isFullBackup } = req.body;
    
    // Crear el backup (puede tomar tiempo)
    const backupPath = await databaseService.createBackup(tables, isFullBackup);
    
    console.log('✅ Backup completed, sending response');
    res.status(200).json({ 
      success: true,
      message: 'Backup created successfully', 
      backupPath 
    });
  } catch (error) {
    console.error('❌ Error in backup route:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating backup', 
      error: error.message 
    });
  }
});

// GET /api/database/backups
router.get('/backups', authenticateToken, async (req, res) => {
    try {
        const backups = await databaseService.getBackups();
        res.status(200).json(backups);
    } catch (error) {
        res.status(500).json({ message: 'Error getting backups', error: error.message });
    }
});

// GET /api/database/backups/:filename/download
router.get('/backups/:filename/download', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = await databaseService.getBackupPath(filename);

        if (!require('fs').existsSync(filePath)) {
            return res.status(404).json({ message: 'Backup file not found' });
        }

        res.download(filePath, filename);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading backup', error: error.message });
    }
});

// DELETE /api/database/backups/:filename
router.delete('/backups/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;
        await databaseService.deleteBackup(filename);
        res.status(200).json({ message: 'Backup deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting backup', error: error.message });
    }
});

module.exports = router;
