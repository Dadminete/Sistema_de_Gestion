const express = require('express');
const router = express.Router();
const { 
    getAllCategoriasPapeleria,
    getCategoriaPapeleriaById,
    createCategoriaPapeleria,
    updateCategoriaPapeleria,
    deleteCategoriaPapeleria
} = require('../services/categoriaPapeleriaService');

router.get('/', async (req, res) => {
    try {
        const categorias = await getAllCategoriasPapeleria();
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const categoria = await getCategoriaPapeleriaById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json(categoria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const nuevaCategoria = await createCategoriaPapeleria(req.body);
        res.status(201).json(nuevaCategoria);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const categoriaActualizada = await updateCategoriaPapeleria(req.params.id, req.body);
        res.json(categoriaActualizada);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await deleteCategoriaPapeleria(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
