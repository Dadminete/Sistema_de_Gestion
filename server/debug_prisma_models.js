const prisma = require('./prismaClient');

async function main() {
    try {
        console.log('--- Inspecting Prisma Client Models ---');

        // Connect first
        await prisma.$connect();

        // Check for department model
        console.log("prisma.departamento exists:", !!prisma.departamento);
        console.log("prisma.Departamento exists:", !!prisma.Departamento);

        // Check for cargo model
        console.log("prisma.cargo exists:", !!prisma.cargo);
        console.log("prisma.Cargo exists:", !!prisma.Cargo);

        // List all keys on prisma instance to see what's available
        const keys = Object.keys(prisma);
        const models = keys.filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.log("Available models/properties:", models.join(', '));

        if (prisma.departamento) {
            console.log("Attempting to fetch departments...");
            const depts = await prisma.departamento.findMany({ take: 1 });
            console.log("Successfully fetched departments:", depts.length);
        }

    } catch (error) {
        console.error("Error during debug:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
