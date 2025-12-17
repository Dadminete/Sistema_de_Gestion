const prisma = require('./server/prismaClient');

async function checkCajaLinks() {
    try {
        console.log('=== Checking Caja-CuentaContable Links ===\n');

        // Get all Cajas with their cuentaContableId
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            select: {
                id: true,
                nombre: true,
                saldoInicial: true,
                saldoActual: true,
                cuentaContableId: true,
                cuentaContable: {
                    select: {
                        codigo: true,
                        nombre: true
                    }
                }
            }
        });

        console.log(`Total Cajas: ${cajas.length}\n`);

        cajas.forEach(caja => {
            console.log(`Caja: ${caja.nombre}`);
            console.log(`  Saldo Inicial: ${caja.saldoInicial}`);
            console.log(`  Saldo Actual: ${caja.saldoActual}`);
            console.log(`  Cuenta Contable ID: ${caja.cuentaContableId || 'NO VINCULADA'}`);
            if (caja.cuentaContable) {
                console.log(`  Cuenta: ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
            }
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCajaLinks();
