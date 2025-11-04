import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create a single instance of Prisma client
const prisma = globalThis.__prisma || new PrismaClient({
  // log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  log: process.env['NODE_ENV'] === 'development' ? ['error', 'warn'] : ['error'],
});

// In development, store the instance globally to prevent multiple instances
if (process.env['NODE_ENV'] === 'development') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export default prisma;