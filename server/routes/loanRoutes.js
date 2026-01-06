const express = require('express');
const router = express.Router();
const { LoanService } = require('../services/loanService');
const { authenticateToken } = require('../middleware/authMiddleware');
const prisma = require('../prismaClient');

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
        res.status(500).json({ error: 'Failed to update loan', details: error.message });
    }
});

// --- Aprobar Prestamo ---
router.post('/:id/approve', async (req, res) => {
    try {
        // Obtener el préstamo para usar su montoSolicitado
        const loan = await LoanService.getLoanById(req.params.id);
        if (!loan) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        // Construir los datos de aprobación
        const approvalData = {
            montoAprobado: loan.montoSolicitado,
            metodoPago: req.body.metodoPago,
            cajaId: req.body.cajaId,
            cuentaBancariaId: req.body.cuentaBancariaId,
            observaciones: req.body.observacionesAprobacion,
            observaciones: req.body.observacionesAprobacion,
            usuarioId: req.user?.id // ID del usuario para el movimiento contable
        };

        // Buscar el empleado asociado al usuario para el campo aprobadoPorId
        if (req.user?.id) {
            const empleado = await prisma.empleado.findUnique({
                where: { usuarioId: req.user.id }
            });
            if (empleado) {
                approvalData.aprobadoPorId = empleado.id; // ID del empleado (BigInt)
            }
        }

        const approvedLoan = await LoanService.approveLoan(req.params.id, approvalData);
        res.json(approvedLoan);
    } catch (error) {
        console.error('Error approving loan:', error);
        res.status(500).json({ error: 'Failed to approve loan', details: error.message });
    }
});

// --- Rechazar Prestamo ---
router.post('/:id/reject', async (req, res) => {
    try {
        const rejectedLoan = await LoanService.rejectLoan(req.params.id, req.body.motivo);
        res.json(rejectedLoan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject loan', details: error.message });
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
