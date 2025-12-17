import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Initialize Prisma Client
const prisma = globalThis.__prisma || new PrismaClient()

// In development, store the client in a global variable to prevent multiple instances
if (typeof window === 'undefined' && globalThis.__prisma === undefined) {
  globalThis.__prisma = prisma as any
}

export default prisma
