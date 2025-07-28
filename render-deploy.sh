#!/bin/bash

echo "🚀 Starting Render deployment with Prisma binary fix..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Copy Prisma schema
echo "📋 Setting up Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# List generated binaries
echo "📋 Generated Prisma binaries:"
ls -la node_modules/.prisma/client/libquery_engine-*

# Copy binary to multiple locations to ensure it's found
echo "📋 Copying binary to multiple locations..."
cp node_modules/.prisma/client/libquery_engine-linux-musl.so.node node_modules/@prisma/client/ 2>/dev/null || true
cp node_modules/.prisma/client/libquery_engine-linux-musl.so.node node_modules/ 2>/dev/null || true

# Set environment variable for production
export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-linux-musl.so.node"
echo "🔧 Using linux-musl binary"

# Verify binary exists
echo "✅ Verifying binary exists:"
ls -la $PRISMA_QUERY_ENGINE_BINARY

# Test with environment variable set
echo "🧪 Testing Prisma with explicit binary path..."
NODE_ENV=production PRISMA_QUERY_ENGINE_BINARY=$PRISMA_QUERY_ENGINE_BINARY node -e "
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

echo "✅ Render deployment build completed successfully!" 