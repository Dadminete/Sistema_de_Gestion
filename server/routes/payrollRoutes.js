const express = require('express');
const router = express.Router();
const { PayrollService } = require('../services/payrollService');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// --- Periodos ---
router.get('/stats/history', async (req, res) => {
    try {
        const history = await PayrollService.getPayrollHistoryStats();
        res.json(history);
    } catch (error) {
        console.error('Error fetching payroll history:', error);
        res.status(500).json({ error: 'Failed to fetch payroll history' });
    }
});

router.get('/periods', async (req, res) => {
    try {
        const periods = await PayrollService.getAllPeriods();
        res.json(periods);
    } catch (error) {
        console.error('Error fetching payroll periods:', error);
        res.status(500).json({ error: 'Failed to fetch payroll periods' });
    }
});

router.get('/periods/:id', async (req, res) => {
    try {
        const period = await PayrollService.getPeriodById(req.params.id);
        if (!period) return res.status(404).json({ error: 'Period not found' });
        res.json(period);
    } catch (error) {
        console.error('Error fetching period:', error);
        res.status(500).json({ error: 'Failed to fetch period' });
    }
});

router.post('/periods', async (req, res) => {
    try {
        const newPeriod = await PayrollService.createPeriod(req.body);
        res.status(201).json(newPeriod);
    } catch (error) {
        console.error('Error creating period:', error);
        res.status(500).json({ error: 'Failed to create period', details: error.message });
    }
});

router.put('/periods/:id', async (req, res) => {
    try {
        const updatedPeriod = await PayrollService.updatePeriod(req.params.id, req.body);
        res.json(updatedPeriod);
    } catch (error) {
        console.error('Error updating period:', error);
        res.status(500).json({ error: 'Failed to update period' });
    }
});

router.delete('/periods/:id', async (req, res) => {
    try {
        await PayrollService.deletePeriod(req.params.id);
        res.json({ message: 'Period deleted successfully' });
    } catch (error) {
        console.error('Error deleting period:', error);
        res.status(500).json({ error: 'Failed to delete period' });
    }
});

// Generate payroll for all employees in a period
router.post('/periods/:id/generate', async (req, res) => {
    try {
        const calculadoPorId = req.user?.id || null;
        const { employeeIds, payrollDetails } = req.body; // Array of employee IDs and variable details
        const payrolls = await PayrollService.generatePayrollForPeriod(
            req.params.id,
            calculadoPorId,
            employeeIds,
            payrollDetails
        );
        res.status(201).json({
            message: `Generated ${payrolls.length} payroll records`,
            payrolls
        });
    } catch (error) {
        console.error('Error generating payroll:', error);
        res.status(500).json({ error: 'Failed to generate payroll', details: error.message });
    }
});

// Get all payrolls for a period
router.get('/periods/:id/payrolls', async (req, res) => {
    try {
        const payrolls = await PayrollService.getPayrollsByPeriod(req.params.id);
        res.json(payrolls);
    } catch (error) {
        console.error('Error fetching payrolls for period:', error);
        res.status(500).json({ error: 'Failed to fetch payrolls for period' });
    }
});

// --- Nomina (Individual Payroll Records) ---
router.get('/payroll/:id', async (req, res) => {
    try {
        const payroll = await PayrollService.getPayrollById(req.params.id);
        if (!payroll) return res.status(404).json({ error: 'Payroll record not found' });
        res.json(payroll);
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({ error: 'Failed to fetch payroll record' });
    }
});

router.get('/employee/:id', async (req, res) => {
    try {
        const payrolls = await PayrollService.getPayrollByEmployee(req.params.id);
        res.json(payrolls);
    } catch (error) {
        console.error('Error fetching employee payrolls:', error);
        res.status(500).json({ error: 'Failed to fetch employee payrolls' });
    }
});

router.post('/payroll', async (req, res) => {
    try {
        const record = await PayrollService.createPayrollRecord(req.body);
        res.status(201).json(record);
    } catch (error) {
        console.error('Error creating payroll record:', error);
        res.status(500).json({ error: 'Failed to create payroll record', details: error.message });
    }
});

router.put('/payroll/:id', async (req, res) => {
    try {
        const updated = await PayrollService.updatePayrollRecord(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error('Error updating payroll record:', error);
        res.status(500).json({ error: 'Failed to update payroll record' });
    }
});

router.delete('/payroll/:id', async (req, res) => {
    try {
        await PayrollService.deletePayrollRecord(req.params.id);
        res.json({ message: 'Payroll record deleted successfully' });
    } catch (error) {
        console.error('Error deleting payroll record:', error);
        res.status(500).json({ error: 'Failed to delete payroll record' });
    }
});

// Update payment status
router.put('/payroll/:id/payment', async (req, res) => {
    try {
        const { status, ...paymentData } = req.body;
        const userId = req.user ? req.user.id : null;
        const updated = await PayrollService.updatePaymentStatus(req.params.id, status, paymentData, userId);
        res.json(updated);
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

// Get pending payroll details with employees
router.get('/pending-details', async (req, res) => {
    try {
        const details = await PayrollService.getPendingPayrollDetails();
        res.json(details);
    } catch (error) {
        console.error('Error fetching pending payroll details:', error);
        res.status(500).json({ error: 'Failed to fetch pending payroll details' });
    }
});

// Get payment details for all payrolls in a period
router.get('/period/:periodId/payment-details', async (req, res) => {
    try {
        const details = await PayrollService.getPaymentDetailsByPeriod(req.params.periodId);
        res.json(details);
    } catch (error) {
        console.error('Error fetching payment details for period:', error);
        res.status(500).json({ error: 'Failed to fetch payment details for period' });
    }
});

// Apply partial payment to payroll
router.post('/payroll/:id/partial-payment', async (req, res) => {
    try {
        const { monto, metodoPago, cajaId, cuentaBancariaId, movimientoContableId } = req.body;
        const userId = req.user ? req.user.id : null;
        const updated = await PayrollService.applyPartialPayment(req.params.id, {
            monto,
            metodoPago,
            cajaId,
            cuentaBancariaId,
            movimientoContableId,
            userId
        });
        res.json(updated);
    } catch (error) {
        console.error('Error applying partial payment:', error);
        res.status(500).json({ error: 'Failed to apply partial payment', details: error.message });
    }
});

module.exports = router;
