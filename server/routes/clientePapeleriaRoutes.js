const express = require('express');
const router = express.Router();
const {
    getAllClientesPapeleria,
    getClientePapeleriaById,
    createClientePapeleria,
    updateClientePapeleria,
    deleteClientePapeleria,
} = require('../services/clientePapeleriaService');

// GET all clients
router.get('/', async (req, res) => {
    try {
        const clientes = await getAllClientesPapeleria();
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET client by ID
router.get('/:id', async (req, res) => {
    try {
        const cliente = await getClientePapeleriaById(req.params.id);
        if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });
        res.json(cliente);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new client
router.post('/', async (req, res) => {
    try {
        const nuevoCliente = await createClientePapeleria(req.body);
        res.status(201).json(nuevoCliente);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT to update a client
router.put('/:id', async (req, res) => {
    try {
        const clienteActualizado = await updateClientePapeleria(req.params.id, req.body);
        res.json(clienteActualizado);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a client
router.delete('/:id', async (req, res) => {
    try {
        await deleteClientePapeleria(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
