const prisma = require('../prismaClient');

const PLAN_ESTRUCTURA = [
    // NIVEL 1: ACTIVO
    {
        codigo: '1', nombre: 'ACTIVO', tipo: 'ACTIVO', nivel: 1, esDetalle: false,
        subcategorias: [
            {
                codigo: '1.1', nombre: 'ACTIVO CORRIENTE', tipo: 'ACTIVO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '1.1.01', nombre: 'Caja', fuentes: ['Caja', 'Caja General'] },
                    { codigo: '1.1.02', nombre: 'Bancos', fuentes: ['Bancos', 'Banco'] },
                    { codigo: '1.1.03', nombre: 'Cuentas por Cobrar', fuentes: ['Cuentas por Cobrar'] },
                    { codigo: '1.1.04', nombre: 'Ahorros (Alcancías)', fuentes: ['Alcancías', 'Ahorros'] }
                ]
            },
            {
                codigo: '1.2', nombre: 'ACTIVO NO CORRIENTE', tipo: 'ACTIVO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '1.2.01', nombre: 'Equipos (Propiedad, Planta y Equipo)', fuentes: ['Compra Equipos', 'Equipos'] },
                    { codigo: '1.2.02', nombre: 'Amortización Acumulada', fuentes: ['Amortización', 'Amortizacion'] }
                ]
            }
        ]
    },
    // NIVEL 2: PASIVO
    {
        codigo: '2', nombre: 'PASIVO', tipo: 'PASIVO', nivel: 1, esDetalle: false,
        subcategorias: [
            {
                codigo: '2.1', nombre: 'PASIVO CORRIENTE', tipo: 'PASIVO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '2.1.01', nombre: 'Cuentas por Pagar', fuentes: ['Cuentas por Pagar'] },
                    { codigo: '2.1.02', nombre: 'Impuestos por Pagar', fuentes: ['Impuestos Bancarios', 'Impuestos'] },
                    { codigo: '2.1.03', nombre: 'Préstamos Bancarios (Corto Plazo)', fuentes: ['Préstamos adquiridos', 'Prestamos'] },
                    { codigo: '2.1.04', nombre: 'Pasivos Operacionales', fuentes: ['PASIVOS CORRIENTES', 'PASIVOS'] }
                ]
            }
        ]
    },
    // NIVEL 3: PATRIMONIO
    {
        codigo: '3', nombre: 'PATRIMONIO', tipo: 'CAPITAL', nivel: 1, esDetalle: false,
        subcategorias: [
            {
                codigo: '3.1', nombre: 'CAPITAL', tipo: 'CAPITAL', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '3.1.01', nombre: 'CAPITAL SOCIAL', fuentes: ['CAPITAL', 'Capital Social'] }, // Added generic match
                ]
            },
            {
                codigo: '3.2', nombre: 'RESULTADOS', tipo: 'CAPITAL', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '3.2.01', nombre: 'RESULTADOS ACUMULADOS', fuentes: ['Utilidades del Período', 'Resultados'] }
                ]
            }
        ]
    },
    // NIVEL 4: INGRESOS
    {
        codigo: '4', nombre: 'INGRESOS', tipo: 'INGRESO', nivel: 1, esDetalle: false,
        subcategorias: [
            {
                codigo: '4.1', nombre: 'INGRESOS OPERACIONALES', tipo: 'INGRESO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '4.1.01', nombre: 'Suscripción de Clientes', fuentes: ['Suscripción de los clientes', 'Suscripcion'] },
                    { codigo: '4.1.02', nombre: 'Ingresos por Servicios', fuentes: ['Ingresos por Servicios'] },
                    { codigo: '4.1.03', nombre: 'Instalación y Mantenimiento', fuentes: ['Camaras CCTV', 'Mantenimiento', 'Instalación'] }
                ]
            },
            {
                codigo: '4.2', nombre: 'OTROS INGRESOS', tipo: 'INGRESO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '4.2.01', nombre: 'Mora de Clientes', fuentes: ['Mora Clientes'] },
                    { codigo: '4.2.02', nombre: 'Intereses Bancarios', fuentes: ['Interés Bancario'] },
                    { codigo: '4.2.03', nombre: 'Ajuste Contable - Ingreso', fuentes: ['Ajuste Contable - Ingreso'] },
                    { codigo: '4.2.04', nombre: 'Regalos / Extras', fuentes: ['Regalos', 'Extras'] }
                ]
            }
        ]
    },
    // NIVEL 5: GASTOS
    {
        codigo: '5', nombre: 'GASTOS', tipo: 'GASTO', nivel: 1, esDetalle: false,
        subcategorias: [
            {
                codigo: '5.1', nombre: 'GASTOS DE PERSONAL', tipo: 'GASTO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '5.1.01', nombre: 'Pago Nómina', fuentes: ['Pago Nomina'] },
                    { codigo: '5.1.02', nombre: 'Comisiones y Honorarios', fuentes: ['Comision', 'Personal Daniel'] }
                ]
            },
            {
                codigo: '5.2', nombre: 'GASTOS DE OPERACIÓN', tipo: 'GASTO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '5.2.01', nombre: 'Gastos de Oficina', fuentes: ['Gastos Oficina', 'Comida', 'Gastos Papeleria'] },
                    { codigo: '5.2.02', nombre: 'Servicios de Infraestructura', fuentes: ['Pago Lineas', 'Pago Plataformas', 'Pago Flotas'] },
                    { codigo: '5.2.03', nombre: 'Reparación y Mantenimiento', fuentes: ['Reparacion Equipos', 'Torre San Carlos', 'Torre Villa Hermosa'] },
                    { codigo: '5.2.04', nombre: 'Gastos Vehiculares/Motor', fuentes: ['Gastos Motor'] },
                    { codigo: '5.2.05', nombre: 'Gastos Diversos', fuentes: ['Gastos Ferreteros', 'Otros Gastos'] }
                ]
            },
            {
                codigo: '5.3', nombre: 'OTROS GASTOS', tipo: 'GASTO', nivel: 2, esDetalle: false,
                cuentas: [
                    { codigo: '5.3.01', nombre: 'Intereses y Comisiones Bancarias', fuentes: ['Impuestos Bancarios'] },
                    { codigo: '5.3.02', nombre: 'Amortización y Depreciación', fuentes: ['Amortizacion (Gasto)'] },
                    { codigo: '5.3.03', nombre: 'Gastos Cierre/Ajuste', fuentes: ['Cierre Mensual', 'Ajuste Contable - Gasto'] },
                    { codigo: '5.3.04', nombre: 'Gastos Personales (Retiros)', fuentes: ['Mis Hijos', 'Regalia'] }
                ]
            }
        ]
    }
];

async function main() {
    console.log('🚀 Iniciando restructuración del Plan de Cuentas...');

    for (const nivel1 of PLAN_ESTRUCTURA) {
        // 1. Crear/Actualizar Categoría Nivel 1
        const catNivel1 = await prisma.categoriaCuenta.upsert({
            where: { codigo: nivel1.codigo },
            update: {
                nombre: nivel1.nombre,
                tipo: nivel1.tipo,
                nivel: 1,
                esDetalle: false,
                // Ensure subcategory consistency if needed? No, relationships handle that.
            },
            create: {
                codigo: nivel1.codigo,
                nombre: nivel1.nombre,
                tipo: nivel1.tipo,
                nivel: 1,
                esDetalle: false
            }
        });

        console.log(`✅ Nivel 1: ${catNivel1.codigo} - ${catNivel1.nombre}`);

        // Procesar Subcategorías (Nivel 2)
        if (nivel1.subcategorias) {
            for (const nivel2 of nivel1.subcategorias) {
                // 2. Crear/Actualizar Categoría Nivel 2
                const catNivel2 = await prisma.categoriaCuenta.upsert({
                    where: { codigo: nivel2.codigo },
                    update: {
                        nombre: nivel2.nombre,
                        tipo: nivel2.tipo,
                        padreId: catNivel1.id,
                        nivel: 2,
                        esDetalle: false
                    },
                    create: {
                        codigo: nivel2.codigo,
                        nombre: nivel2.nombre,
                        tipo: nivel2.tipo,
                        padreId: catNivel1.id,
                        nivel: 2,
                        esDetalle: false
                    }
                });
                console.log(`   📂 Nivel 2: ${catNivel2.codigo} - ${catNivel2.nombre}`);

                // Procesar Cuentas (Nivel 3 - Hojas)
                if (nivel2.cuentas) {
                    for (const cuentaPlan of nivel2.cuentas) {
                        // Estrategia: Buscar cuenta existente por fuentes (nombres antiguos) o crear nueva con el código nuevo.

                        // Paso 1: Intentar buscar una cuenta existente que coincida con alguna 'fuente'
                        let existingAccount = null;

                        // Primero buscamos por código EXACTO (si ya se corrió el script o existe)
                        existingAccount = await prisma.cuentaContable.findUnique({
                            where: { codigo: cuentaPlan.codigo }
                        });

                        if (!existingAccount && cuentaPlan.fuentes && cuentaPlan.fuentes.length > 0) {
                            // Buscar por nombre (fuente)
                            // Usamos findFirst buscando coincidencia parcial o exacta
                            for (const fuente of cuentaPlan.fuentes) {
                                const found = await prisma.cuentaContable.findFirst({
                                    where: {
                                        OR: [
                                            { nombre: { equals: fuente, mode: 'insensitive' } },
                                            { nombre: { contains: fuente, mode: 'insensitive' } }
                                        ]
                                    }
                                });
                                if (found) {
                                    existingAccount = found;
                                    console.log(`      Found existing account '${found.nombre}' (Code: ${found.codigo}) matching source '${fuente}'`);
                                    break; // Stop looking if found
                                }
                            }
                        }

                        if (existingAccount) {
                            // Actualizar cuenta existente
                            await prisma.cuentaContable.update({
                                where: { id: existingAccount.id },
                                data: {
                                    codigo: cuentaPlan.codigo, // Update code to new standard
                                    nombre: cuentaPlan.nombre, // Update name to new standard
                                    categoriaId: catNivel2.id, // Relink to new category hierarchy
                                    tipoCuenta: catNivel2.tipo // Ensure type matches
                                }
                            });
                            console.log(`      🔄 Updated: ${cuentaPlan.codigo} - ${cuentaPlan.nombre} (was ${existingAccount.codigo})`);
                        } else {
                            // Crear cuenta nueva
                            await prisma.cuentaContable.create({
                                data: {
                                    codigo: cuentaPlan.codigo,
                                    nombre: cuentaPlan.nombre,
                                    categoriaId: catNivel2.id,
                                    tipoCuenta: catNivel2.tipo,
                                    saldoInicial: 0,
                                    saldoActual: 0,
                                    activa: true
                                }
                            });
                            console.log(`      ✨ Created: ${cuentaPlan.codigo} - ${cuentaPlan.nombre}`);
                        }
                    }
                }
            }
        }
    }

    // Final Cleanup: Update 'padreId' relations for categories if any were missed or need recursive re-check (already done in upsert of Nivel 2).
    console.log('🏁 Plan de Cuentas Optimizado completado exitosamente.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
