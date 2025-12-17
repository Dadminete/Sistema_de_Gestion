const prisma = require('./server/prismaClient');

async function checkCurrentState() {
    try {
        console.log('=== Current Cajas State ===\n');

        // Get all Cajas with their actual values
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            include: {
                cuentaContable: {
                    select: { codigo: true, nombre: true }
                }
            }
        });

        cajas.forEach(caja => {
            console.log(`Caja: ${caja.nombre}`);
            console.log(`  ID: ${caja.id}`);
            console.log(`  Saldo Inicial: ${caja.saldoInicial}`);
            console.log(`  Saldo Actual: ${caja.saldoActual}`);
            console.log(`  Linked to: ${caja.cuentaContable ? caja.cuentaContable.codigo + ' - ' + caja.cuentaContable.nombre : 'NOT LINKED'}`);
            console.log('');
        });

        console.log('=== All CuentasContables ===\n');
        const cuentas = await prisma.cuentaContable.findMany({
            where: { activa: true },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                saldoInicial: true,
                saldoActual: true
            },
            orderBy: { codigo: 'asc' }
        });

        cuentas.forEach(cuenta => {
            console.log(`${cuenta.codigo} - ${cuenta.nombre}`);
            console.log(`  ID: ${cuenta.id}`);
            console.log(`  Saldo Inicial DB: ${cuenta.saldoInicial}`);
            console.log(`  Saldo Actual DB: ${cuenta.saldoActual}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCurrentState();
