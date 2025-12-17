const express = require('express');
const router = express.Router();
const { CuentaContableService } = require('../services/cuentaContableService');

router.get('/', async (req, res) => {
  try {
    const cuentas = await CuentaContableService.getAll();
    res.json(cuentas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cuenta = await CuentaContableService.getById(req.params.id);
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const newCuenta = await CuentaContableService.create(req.body);
    res.status(201).json(newCuenta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedCuenta = await CuentaContableService.update(req.params.id, req.body);
    res.json(updatedCuenta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await CuentaContableService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;