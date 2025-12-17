const express = require('express');
const router = express.Router();
const { 
    getAllVentasPapeleria,
    getVentaPapeleriaById,
    createVentaPapeleria,
    updateVentaPapeleria,
    deleteVentaPapeleria,
    getTotalVentasPapeleria
} = require('../services/ventaPapeleriaService');

router.get('/', async (req, res) => {
    try {
        const ventas = await getAllVentasPapeleria();
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/total', async (req, res) => {
    try {
        const total = await getTotalVentasPapeleria();
        res.json({ total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const venta = await getVentaPapeleriaById(req.params.id);
        if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });
        res.json(venta);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const nuevaVenta = await createVentaPapeleria(req.body);
        res.status(201).json(nuevaVenta);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedVenta = await updateVentaPapeleria(req.params.id, req.body);
        res.json(updatedVenta);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await deleteVentaPapeleria(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;