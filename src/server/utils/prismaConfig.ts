import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ MongoDB connected successfully via Prisma');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
} 