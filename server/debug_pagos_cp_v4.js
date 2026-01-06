const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function debugPayments() {
    const docNum = '840819940';
    let output = `--- DEBUGGING ACCOUNT: ${docNum} ---\n`;

    const cuenta = await prisma.cuentaPorPagar.findUnique({
        where: { numeroDocumento: docNum },
        include: {
            proveedor: true,
            pagos: {
                include: {
                    creadoPor: true
                }
            }
        }
    });

    if (!cuenta) {
        output += 'ERROR: Account not found by document number.\n';
        fs.writeFileSync('debug_results.txt', output);
        return;
    }

    output += 'ACCOUNT DETAILS:\n';
    output += `- ID: ${cuenta.id}\n`;
    output += `- Prov: ${cuenta.proveedor?.nombre}\n`;
    output += `- Original: ${cuenta.montoOriginal}\n`;
    output += `- Pendiente: ${cuenta.montoPendiente}\n`;
    output += `- Estado: ${cuenta.estado}\n`;

    output += `\nPAYMENTS LINKED TO THIS ACCOUNT (${cuenta.pagos.length}):\n`;
    cuenta.pagos.forEach((p, i) => {
        output += `  [${i + 1}] ID: ${p.id}, Amount: ${p.monto}, Date: ${p.fechaPago}, CreatedBy: ${p.creadoPor?.nombre || 'N/A'}\n`;
    });

    output += '\nSEARCHING MOVEMENTS FOR THIS ACCOUNT...\n';
    const provName = cuenta.proveedor?.nombre || '';
    const movements = await prisma.movimientoContable.findMany({
        where: {
            OR: [
                { descripcion: { contains: docNum, mode: 'insensitive' } },
                { descripcion: { contains: provName, mode: 'insensitive' } }
            ],
            fecha: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            usuario: true
        }
    });

    output += `Found ${movements.length} related movements:\n`;
    movements.forEach((m, i) => {
        output += `  [${i + 1}] ID: ${m.id}, Amount: ${m.monto}, Type: ${m.tipo}, Desc: ${m.descripcion}, Date: ${m.fecha}\n`;
    });

    const recentPagos = await prisma.pagoCuentaPorPagar.findMany({
        where: {
            fechaPago: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            cuentaPorPagar: true
        },
        take: 20,
        orderBy: { fechaPago: 'desc' }
    });

    output += '\nRECENT ACCOUNT PAYABLE PAYMENTS (LAST 20):\n';
    recentPagos.forEach(p => {
        output += `- Date: ${p.fechaPago}, Amount: ${p.monto}, Doc: ${p.cuentaPorPagar?.numeroDocumento}, AccountID: ${p.cuentaPorPagarId}\n`;
    });

    fs.writeFileSync('debug_results.txt', output);
    console.log('Results written to debug_results.txt');
}

debugPayments()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
