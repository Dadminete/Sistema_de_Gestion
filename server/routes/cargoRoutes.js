const express = require('express');
const router = express.Router();
const { CargoService } = require('../services/cargoService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const cargos = await CargoService.getAll();
        res.json(cargos);
    } catch (error) {
        console.error('Error fetching cargos:', error);
        res.status(500).json({ error: 'Failed to fetch cargos', message: error.message, stack: error.stack });
    }
});

router.post('/', async (req, res) => {
    try {
        const newCargo = await CargoService.create(req.body);
        res.status(201).json(newCargo);
    } catch (error) {
        console.error('Error creating cargo:', error);
        res.status(500).json({ error: 'Failed to create cargo' });
    }
});

module.exports = router;
