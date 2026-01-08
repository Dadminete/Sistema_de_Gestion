
const prisma = require('./prismaClient');

async function checkUsers() {
    try {
        const users = await prisma.usuario.findMany({
            select: { id: true, username: true, activo: true }
        });
        console.log('Users found:', users);
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
