const express = require('express');
const router = express.Router();
const { 
    getAllProductosPapeleria,
    getProductoPapeleriaById,
    createProductoPapeleria,
    updateProductoPapeleria,
    deleteProductoPapeleria
} = require('../services/productoPapeleriaService');

router.get('/', async (req, res) => {
    try {
        const productos = await getAllProductosPapeleria();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const producto = await getProductoPapeleriaById(req.params.id);
        if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log('POST /productos received data:', req.body);
        const nuevoProducto = await createProductoPapeleria(req.body);
        console.log('Product created successfully:', nuevoProducto.id);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error('Error creating product:', error);

        // Handle custom validation errors
        if (error.message.includes('Ya existe un producto')) {
            return res.status(400).json({ message: error.message });
        }

        if (error.message.includes('es requerido')) {
            return res.status(400).json({ message: error.message });
        }

        if (error.message.includes('no existe')) {
            return res.status(400).json({ message: error.message });
        }

        // Handle Prisma unique constraint errors
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            if (field === 'codigo') {
                return res.status(400).json({ message: 'Ya existe un producto con ese código. Por favor, use un código diferente.' });
            }
            if (field === 'codigoBarras') {
                return res.status(400).json({ message: 'Ya existe un producto con ese código de barras. Por favor, use un código de barras diferente.' });
            }
        }

        // Handle Prisma foreign key constraint errors
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Error de referencia: ' + error.message });
        }

        // Handle other Prisma errors
        if (error.code) {
            console.error('Prisma error:', error.code, error.message);
            return res.status(400).json({ message: 'Error de base de datos: ' + error.message });
        }

        // Generic server error
        res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        console.log('PUT /productos/:id received data:', req.body);
        const productoActualizado = await updateProductoPapeleria(req.params.id, req.body);
        console.log('Product updated successfully:', productoActualizado.id);
        res.json(productoActualizado);
    } catch (error) {
        console.error('Error updating product:', error);

        // Handle custom validation errors
        if (error.message.includes('Ya existe un producto')) {
            return res.status(400).json({ message: error.message });
        }

        if (error.message.includes('es requerido')) {
            return res.status(400).json({ message: error.message });
        }

        if (error.message.includes('no existe')) {
            return res.status(400).json({ message: error.message });
        }

        // Handle Prisma unique constraint errors
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            if (field === 'codigo') {
                return res.status(400).json({ message: 'Ya existe un producto con ese código. Por favor, use un código diferente.' });
            }
            if (field === 'codigoBarras') {
                return res.status(400).json({ message: 'Ya existe un producto con ese código de barras. Por favor, use un código de barras diferente.' });
            }
        }

        // Handle Prisma foreign key constraint errors
        if (error.code === 'P2003') {
            return res.status(400).json({ message: 'Error de referencia: ' + error.message });
        }

        // Handle Prisma not found errors
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Handle other Prisma errors
        if (error.code) {
            console.error('Prisma error:', error.code, error.message);
            return res.status(400).json({ message: 'Error de base de datos: ' + error.message });
        }

        // Generic server error
        res.status(500).json({ message: 'Error interno del servidor', details: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await deleteProductoPapeleria(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
