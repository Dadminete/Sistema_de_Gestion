const bankService = require('./services/bankService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log('--- Testing getMonthlyStats ---');
    try {
        const stats = await bankService.getMonthlyStats();
        console.log('Stats:', stats);
    } catch (error) {
        console.error('FAILED with error:', error);
    }
}

test().finally(() => prisma.$disconnect());
