const fs = require('fs');
const path = require('path');
const prisma = require('../prismaClient');

const BACKUP_FILE = path.join(__dirname, '../backups/full-backup-2025-12-05T01-13-16-519Z.sql');

async function restoreStructure() {
    console.log(`🚀 Starting Restore from: ${BACKUP_FILE}`);

    try {
        const fileContent = fs.readFileSync(BACKUP_FILE, 'utf8');
        const backupData = JSON.parse(fileContent);

        // 1. Restore Categories (categorias_cuentas)
        if (backupData.data && backupData.data.categorias_cuentas) {
            console.log(`\n📦 Restoring ${backupData.data.categorias_cuentas.length} Categories...`);
            for (const cat of backupData.data.categorias_cuentas) {
                await prisma.categoriaCuenta.upsert({
                    where: { id: cat.id },
                    update: {
                        codigo: cat.codigo,
                        nombre: cat.nombre,
                        tipo: cat.tipo,
                        subtipo: cat.subtipo,
                        padreId: cat.padre_id || cat.padreId, // Handle both casing if needed, backup is usually db column names? Checks backup format below
                        nivel: cat.nivel,
                        esDetalle: cat.es_detalle || cat.esDetalle,
                        activa: cat.activa
                    },
                    create: {
                        id: cat.id,
                        codigo: cat.codigo,
                        nombre: cat.nombre,
                        tipo: cat.tipo,
                        subtipo: cat.subtipo,
                        padreId: cat.padre_id || cat.padreId,
                        nivel: cat.nivel,
                        esDetalle: cat.es_detalle || cat.esDetalle,
                        activa: cat.activa
                    }
                });
                process.stdout.write('.');
            }
            console.log(' Done.');
        }

        // 2. Restore Accounts (cuentas_contables)
        // We only update definitions, NOT balances to avoid breaking recent transactions
        if (backupData.data && backupData.data.cuentas_contables) {
            console.log(`\n📦 Restoring ${backupData.data.cuentas_contables.length} Accounts definitions...`);
            for (const account of backupData.data.cuentas_contables) {
                // Check if it exists
                const exists = await prisma.cuentaContable.findUnique({ where: { id: account.id } });

                if (exists) {
                    // Restore definition
                    await prisma.cuentaContable.update({
                        where: { id: account.id },
                        data: {
                            codigo: account.codigo,
                            nombre: account.nombre,
                            categoriaId: account.categoria_id || account.categoriaId,
                            tipoCuenta: account.tipo_cuenta || account.tipoCuenta,
                            // moneda: account.moneda, // safe to restore
                            // saldoInicial: account.saldo_inicial // Do we revert this? Maybe safest to keep current if transactions happened.
                            // But user wants "return to previous form". 
                            // Let's assume structure is the main request. 
                            // If I revert saldoInicial, I might break reconciliation if they edited it.
                            // I will revert: Code, Name, Category, Type which defines the "Structure".
                        }
                    });
                } else {
                    // Re-create if it was deleted (unlikely given my previous script didn't delete)
                    // But if I created NEW accounts in the previous step, they will remain as "orphans" or "extras".
                    // Should I delete accounts that are NOT in the backup? Use with caution.
                    // The user said "devuelvelos a su forma anterior". 
                    // Using upsert is safer.
                    await prisma.cuentaContable.create({
                        data: {
                            id: account.id,
                            codigo: account.codigo,
                            nombre: account.nombre,
                            categoriaId: account.categoria_id || account.categoriaId,
                            tipoCuenta: account.tipo_cuenta || account.tipoCuenta,
                            moneda: account.moneda || 'DOP',
                            saldoInicial: account.saldo_inicial || 0,
                            saldoActual: account.saldo_actual || 0, // Fallback
                            activa: account.activa
                        }
                    });
                }
                process.stdout.write('.');
            }
            console.log(' Done.');
        }

        // 3. Remove New Accounts?
        // If exact restoration is requested, I should probably identify accounts created *today* that are NOT in the backup and delete them?
        // Risk: Deleting an account with transactions.
        // Compromise: I will leave them for now. The request is usually about the "mess" I made of the structure. restoring the old structure fixes the view.

        console.log('\n✅ Restore completed successfully.');

    } catch (error) {
        console.error('❌ Restore failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restoreStructure();
