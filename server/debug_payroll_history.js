const { PayrollService } = require('./services/payrollService');

async function debugHistory() {
    try {
        console.log('Fetching payroll history stats...');
        const stats = await PayrollService.getPayrollHistoryStats();
        console.log('Stats retrieved:', JSON.stringify(stats, null, 2));

        if (stats.length === 0) {
            console.log('WARNING: No stats returned. Check if there are any CLOSED payroll periods with records.');

            // Dictionary check: are there any payrolls at all?
            const PrismaRetry = require('./prismaRetry');
            const prisma = new PrismaRetry();

            const count = await prisma.nomina.count();
            console.log('Total payroll records in DB:', count);

            const periods = await prisma.periodoNomina.findMany({ take: 5 });
            console.log('Sample periods:', periods);
        }

    } catch (error) {
        console.error('Error debugging history:', error);
    }
}

debugHistory();
