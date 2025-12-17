const prisma = require('./server/prismaClient');

async function linkCajasToCuentas() {
    try {
        console.log('=== Linking Cajas to CuentasContables ===\n');

        // Find "Caja Principal" cuenta contable
        const cajaPrincipalCuenta = await prisma.cuentaContable.findFirst({
            where: {
                OR: [
                    { nombre: { contains: 'Caja Principal', mode: 'insensitive' } },
                    { codigo: '001' }
                ]
            }
        });

        if (cajaPrincipalCuenta) {
            console.log(`Found Cuenta: ${cajaPrincipalCuenta.codigo} - ${cajaPrincipalCuenta.nombre}`);

            // Link Caja Principal
            const cajaPrincipal = await prisma.caja.findFirst({
                where: { nombre: 'Caja Principal' }
            });

            if (cajaPrincipal) {
                await prisma.caja.update({
                    where: { id: cajaPrincipal.id },
                    data: { cuentaContableId: cajaPrincipalCuenta.id }
                });
                console.log(`✓ Linked Caja Principal to ${cajaPrincipalCuenta.nombre}`);
            }
        } else {
            console.log('⚠ Cuenta "Caja Principal" not found');
        }

        // Find "Papelería" or similar cuenta
        const papeleriaCuenta = await prisma.cuentaContable.findFirst({
            where: {
                OR: [
                    { nombre: { contains: 'Papeler', mode: 'insensitive' } },
                    { nombre: { contains: 'Caja', mode: 'insensitive' } }
                ]
            }
        });

        if (papeleriaCuenta) {
            console.log(`Found Cuenta: ${papeleriaCuenta.codigo} - ${papeleriaCuenta.nombre}`);

            // Link Papelería caja
            const papeleriaCaja = await prisma.caja.findFirst({
                where: { nombre: 'Papelería' }
            });

            if (papeleriaCaja && papeleriaCaja.cuentaContableId !== papeleriaCuenta.id) {
                await prisma.caja.update({
                    where: { id: papeleriaCaja.id },
                    data: { cuentaContableId: papeleriaCuenta.id }
                });
                console.log(`✓ Linked Papelería to ${papeleriaCuenta.nombre}`);
            }
        } else {
            console.log('⚠ Cuenta for Papelería not found');
        }

        // Verify links
        console.log('\n=== Verification ===');
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            include: {
                cuentaContable: {
                    select: { codigo: true, nombre: true }
                }
            }
        });

        cajas.forEach(caja => {
            console.log(`${caja.nombre} -> ${caja.cuentaContable ? caja.cuentaContable.codigo + ' - ' + caja.cuentaContable.nombre : 'NOT LINKED'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

linkCajasToCuentas();
