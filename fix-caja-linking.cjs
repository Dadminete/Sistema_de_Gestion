const prisma = require('./server/prismaClient');

async function fixCajaLinking() {
    try {
        console.log('=== Fixing Caja-CuentaContable Linking ===\n');

        // Get the Papelería cuenta contable
        const papeleriaCuenta = await prisma.cuentaContable.findFirst({
            where: { codigo: '003' }
        });

        if (!papeleriaCuenta) {
            console.log('ERROR: Cuenta "003 - Papelería" not found');
            process.exit(1);
        }

        console.log(`Found Cuenta: ${papeleriaCuenta.codigo} - ${papeleriaCuenta.nombre}`);
        console.log(`  ID: ${papeleriaCuenta.id}\n`);

        // Get the Papelería caja
        const papeleriaCaja = await prisma.caja.findFirst({
            where: { nombre: 'Papelería' }
        });

        if (!papeleriaCaja) {
            console.log('ERROR: Caja "Papelería" not found');
            process.exit(1);
        }

        console.log(`Found Caja: ${papeleriaCaja.nombre}`);
        console.log(`  Current link: ${papeleriaCaja.cuentaContableId}\n`);

        // Update the link
        await prisma.caja.update({
            where: { id: papeleriaCaja.id },
            data: { cuentaContableId: papeleriaCuenta.id }
        });

        console.log(`✓ Updated Papelería caja to link to ${papeleriaCuenta.codigo} - ${papeleriaCuenta.nombre}\n`);

        // Verify the changes
        console.log('=== Verification ===\n');
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            include: {
                cuentaContable: {
                    select: { codigo: true, nombre: true }
                }
            }
        });

        cajas.forEach(caja => {
            console.log(`${caja.nombre}:`);
            console.log(`  Saldo Inicial: ${caja.saldoInicial}`);
            console.log(`  Saldo Actual: ${caja.saldoActual}`);
            console.log(`  Linked to: ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixCajaLinking();
