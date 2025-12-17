const express = require('express');
const router = express.Router();
const { DepartmentService } = require('../services/departmentService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const departments = await DepartmentService.getAll();
        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

router.post('/', async (req, res) => {
    try {
        const newDepartment = await DepartmentService.create(req.body);
        res.status(201).json(newDepartment);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

module.exports = router;
