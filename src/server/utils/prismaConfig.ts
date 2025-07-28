import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

// Force Linux environment for production
const isProduction = process.env.NODE_ENV === 'production';

// Set the binary path explicitly for production
if (isProduction) {
  const binaryPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'libquery_engine-debian-openssl-3.0.x.so.node');
  
  if (fs.existsSync(binaryPath)) {
    process.env.PRISMA_QUERY_ENGINE_BINARY = binaryPath;
    console.log(`🔧 Production: Set PRISMA_QUERY_ENGINE_BINARY to: ${binaryPath}`);
  } else {
    console.log('⚠️  Production: Binary not found at:', binaryPath);
    
    // Try alternative locations
    const alternativePaths = [
      path.join(process.cwd(), 'node_modules', '@prisma', 'client', 'libquery_engine-debian-openssl-3.0.x.so.node'),
      path.join(process.cwd(), 'node_modules', 'libquery_engine-debian-openssl-3.0.x.so.node'),
    ];
    
    for (const altPath of alternativePaths) {
      if (fs.existsSync(altPath)) {
        process.env.PRISMA_QUERY_ENGINE_BINARY = altPath;
        console.log(`🔧 Production: Set PRISMA_QUERY_ENGINE_BINARY to: ${altPath}`);
        break;
      }
    }
  }
} else {
  // For development, use the native binary
  const nativePath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'libquery_engine-darwin-arm64.dylib.node');
  if (fs.existsSync(nativePath)) {
    process.env.PRISMA_QUERY_ENGINE_BINARY = nativePath;
    console.log(`🔧 Development: Set PRISMA_QUERY_ENGINE_BINARY to: ${nativePath}`);
  }
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
    throw error;
  }
} 