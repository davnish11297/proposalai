#!/bin/bash

echo "🚀 Starting Render deployment build..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Copy Prisma schema
echo "📋 Setting up Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client with all binary targets
echo "🔨 Generating Prisma client..."
npx prisma generate

# List all generated binaries
echo "📋 Generated Prisma binaries:"
ls -la node_modules/.prisma/client/libquery_engine-*

# Copy all binaries to @prisma/client directory
echo "📋 Copying binaries to @prisma/client..."
cp node_modules/.prisma/client/libquery_engine-* node_modules/@prisma/client/ 2>/dev/null || true

# Verify binaries are in place
echo "✅ Verifying binaries in @prisma/client:"
ls -la node_modules/@prisma/client/libquery_engine-* 2>/dev/null || echo "No binaries found in @prisma/client"

# Test Prisma connection
echo "🧪 Testing Prisma connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Prisma connection successful');
    return prisma.\$disconnect();
  })
  .then(() => {
    console.log('✅ Prisma disconnected successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Prisma connection failed:', error.message);
    process.exit(1);
  });
"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Render build completed successfully!" 