import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// Function to find the correct Prisma binary
function findPrismaBinary(): string | undefined {
  const possiblePaths = [
    // Check in .prisma/client first
    path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'libquery_engine-debian-openssl-3.0.x.so.node'),
    // Check in @prisma/client
    path.join(process.cwd(), 'node_modules', '@prisma', 'client', 'libquery_engine-debian-openssl-3.0.x.so.node'),
    // Check in node_modules root
    path.join(process.cwd(), 'node_modules', 'libquery_engine-debian-openssl-3.0.x.so.node'),
  ];

  for (const binaryPath of possiblePaths) {
    if (fs.existsSync(binaryPath)) {
      console.log(`✅ Found Prisma binary at: ${binaryPath}`);
      return binaryPath;
    }
  }

  console.log('⚠️  Prisma binary not found in expected locations');
  return undefined;
}

// Set the binary path if found
const binaryPath = findPrismaBinary();
if (binaryPath && process.env.NODE_ENV === 'production') {
  process.env.PRISMA_QUERY_ENGINE_BINARY = binaryPath;
  console.log(`🔧 Set PRISMA_QUERY_ENGINE_BINARY to: ${binaryPath}`);
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