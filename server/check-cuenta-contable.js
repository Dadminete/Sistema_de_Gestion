const prisma = require('./prismaClient');

async function checkCuentasContables() {
    try {
        // Obtener la cuenta contable de Caja Principal
        const cuentaCajaPrincipal = await prisma.cuentaContable.findUnique({
            where: { id: '690c7df3-9de4-49b7-8069-bcd3e83dd8be' },
            include: {
                cajas: true
            }
        });

        console.log('===== CUENTA CONTABLE - CAJA PRINCIPAL =====');
        console.log(`Nombre: ${cuentaCajaPrincipal.nombre}`);
        console.log(`Saldo en cuenta_contable: RD$${cuentaCajaPrincipal.saldoActual}`);
        console.log(`Saldo en caja: RD$${cuentaCajaPrincipal.cajas[0]?.saldoActual || 'N/A'}`);
        console.log(`\nDISCREPANCIA: ${parseFloat(cuentaCajaPrincipal.saldoActual) !== parseFloat(cuentaCajaPrincipal.cajas[0]?.saldoActual || 0)}`);

        // Obtener la cuenta contable de Caja Fuerte
        const cuentaCajaFuerte = await prisma.cuentaContable.findUnique({
            where: { id: '3df860f8-362f-42f9-a47f-6a94fd995d7f' },
            include: {
                cajas: true
            }
        });

        console.log('\n===== CUENTA CONTABLE - CAJA FUERTE =====');
        console.log(`Nombre: ${cuentaCajaFuerte.nombre}`);
        console.log(`Saldo en cuenta_contable: RD$${cuentaCajaFuerte.saldoActual}`);
        console.log(`Saldo en caja: RD$${cuentaCajaFuerte.cajas[0]?.saldoActual || 'N/A'}`);
        console.log(`\nDISCREPANCIA: ${parseFloat(cuentaCajaFuerte.saldoActual) !== parseFloat(cuentaCajaFuerte.cajas[0]?.saldoActual || 0)}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCuentasContables();
