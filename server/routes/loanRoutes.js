const express = require('express');
const router = express.Router();
const { LoanService } = require('../services/loanService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// --- Tipos ---
router.get('/types', async (req, res) => {
    try {
        const types = await LoanService.getAllLoanTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loan types' });
    }
});

// --- Prestamos ---
router.get('/', async (req, res) => {
    try {
        const loans = await LoanService.getAllLoans();
        res.json(loans);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loans' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const loan = await LoanService.getLoanById(req.params.id);
        if (!loan) return res.status(404).json({ error: 'Loan not found' });
        res.json(loan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch loan' });
    }
});

router.post('/', async (req, res) => {
    try {
        const newLoan = await LoanService.createLoan(req.body);
        res.status(201).json(newLoan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create loan', details: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedLoan = await LoanService.updateLoan(req.params.id, req.body);
        res.json(updatedLoan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update loan' });
    }
});

// --- Pagos ---
router.post('/:id/payment', async (req, res) => {
    try {
        const payment = await LoanService.registerPayment(req.params.id, req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to register payment', details: error.message });
    }
});

module.exports = router;
