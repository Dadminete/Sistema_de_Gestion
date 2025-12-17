const express = require('express');
const router = express.Router();
const { EmployeeService } = require('../services/employeeService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware to protect all routes
router.use(authenticateToken);

// Get all employees
router.get('/', async (req, res) => {
    try {
        const employees = await EmployeeService.getAll();
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
    try {
        const employee = await EmployeeService.getById(req.params.id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Create employee
router.post('/', async (req, res) => {
    try {
        const newEmployee = await EmployeeService.create(req.body);
        res.status(201).json(newEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Failed to create employee', details: error.message });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const updatedEmployee = await EmployeeService.update(req.params.id, req.body);
        res.json(updatedEmployee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        await EmployeeService.delete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;
