const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/proveedores - Obtener todos los proveedores
router.get('/', async (req, res) => {
  try {
    const { activo, tipoProveedor } = req.query;
    
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (tipoProveedor) where.tipoProveedor = tipoProveedor;

    const proveedores = await prisma.proveedor.findMany({
      where,
      orderBy: [{ nombre: 'asc' }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        razonSocial: true,
        rnc: true,
        telefono: true,
        email: true,
        direccion: true,
        contacto: true,
        telefonoContacto: true,
        emailContacto: true,
        tipoProveedor: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/proveedores/:id - Obtener un proveedor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        cuentasPorPagar: {
          select: {
            id: true,
            numeroDocumento: true,
            montoOriginal: true,
            montoPendiente: true,
            estado: true,
            fechaVencimiento: true
          },
          orderBy: { fechaEmision: 'desc' }
        }
      }
    });

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/proveedores - Crear un nuevo proveedor
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      razonSocial,
      rnc,
      telefono,
      email,
      direccion,
      contacto,
      telefonoContacto,
      emailContacto,
      tipoProveedor = 'general'
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }

    // Generar código automático
    const ultimoProveedor = await prisma.proveedor.findFirst({
      orderBy: { codigo: 'desc' }
    });

    let nuevoCodigo = 'PROV-0001';
    if (ultimoProveedor) {
      const numero = parseInt(ultimoProveedor.codigo.split('-')[1]) + 1;
      nuevoCodigo = `PROV-${numero.toString().padStart(4, '0')}`;
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        codigo: nuevoCodigo,
        nombre: nombre.trim(),
        razonSocial: razonSocial?.trim(),
        rnc: rnc?.trim(),
        telefono: telefono?.trim(),
        email: email?.trim(),
        direccion: direccion?.trim(),
        contacto: contacto?.trim(),
        telefonoContacto: telefonoContacto?.trim(),
        emailContacto: emailContacto?.trim(),
        tipoProveedor,
        activo: true
      }
    });

    res.status(201).json(proveedor);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'rnc') {
        return res.status(409).json({ error: 'Ya existe un proveedor con este RNC' });
      } else if (field === 'codigo') {
        return res.status(409).json({ error: 'Ya existe un proveedor con este código' });
      }
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/proveedores/:id - Actualizar un proveedor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      razonSocial,
      rnc,
      telefono,
      email,
      direccion,
      contacto,
      telefonoContacto,
      emailContacto,
      tipoProveedor,
      activo
    } = req.body;

    // Verificar que el proveedor existe
    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id }
    });

    if (!proveedorExistente) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Validar campos requeridos
    if (nombre !== undefined && (!nombre || !nombre.trim())) {
      return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
    }

    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(razonSocial !== undefined && { razonSocial: razonSocial?.trim() }),
        ...(rnc !== undefined && { rnc: rnc?.trim() }),
        ...(telefono !== undefined && { telefono: telefono?.trim() }),
        ...(email !== undefined && { email: email?.trim() }),
        ...(direccion !== undefined && { direccion: direccion?.trim() }),
        ...(contacto !== undefined && { contacto: contacto?.trim() }),
        ...(telefonoContacto !== undefined && { telefonoContacto: telefonoContacto?.trim() }),
        ...(emailContacto !== undefined && { emailContacto: emailContacto?.trim() }),
        ...(tipoProveedor !== undefined && { tipoProveedor }),
        ...(activo !== undefined && { activo })
      }
    });

    res.json(proveedor);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'rnc') {
        return res.status(409).json({ error: 'Ya existe un proveedor con este RNC' });
      }
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/proveedores/:id - Eliminar un proveedor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el proveedor existe
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        cuentasPorPagar: true
      }
    });

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Verificar si tiene cuentas por pagar asociadas
    if (proveedor.cuentasPorPagar.length > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar el proveedor porque tiene cuentas por pagar asociadas'
      });
    }

    await prisma.proveedor.delete({
      where: { id }
    });

    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;