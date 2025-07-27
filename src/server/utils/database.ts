import { PrismaClient } from '@prisma/client';

// Set environment variable to help Prisma find the binary
if (process.env.NODE_ENV === 'production') {
  process.env.PRISMA_QUERY_ENGINE_BINARY = 'node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node';
}

export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    // Don't exit immediately, give it a chance to retry
    throw error;
  }
} 