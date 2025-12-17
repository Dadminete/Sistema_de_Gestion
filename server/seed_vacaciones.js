const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tipos = [
        { nombreTipo: 'Vacaciones Normales', diasPorAno: 14, acumulable: true },
        { nombreTipo: 'Permiso Especial', diasPorAno: 5, acumulable: false },
        { nombreTipo: 'Vacaciones Extraordinarias', diasPorAno: 0, acumulable: false }
    ];

    for (const tipo of tipos) {
        const exists = await prisma.tipoVacacion.findFirst({
            where: { nombreTipo: tipo.nombreTipo }
        });

        if (!exists) {
            await prisma.tipoVacacion.create({
                data: tipo
            });
            console.log(`Created TipoVacacion: ${tipo.nombreTipo}`);
        } else {
            console.log(`TipoVacacion already exists: ${tipo.nombreTipo}`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
