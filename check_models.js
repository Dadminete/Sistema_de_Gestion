import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkModels() {
    try {
        // Prisma client instance has keys for each model delegate (e.g. prisma.user, prisma.post)
        // Detailed properties usually start with lowercase model names.
        const keys = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$'));
        console.log('Available Models:', keys);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkModels();
