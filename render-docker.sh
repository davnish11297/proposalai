#!/bin/bash

echo "🚀 Starting Docker-based Render deployment for Linux environment..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Copy Prisma schema
echo "📋 Setting up Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Force Linux environment for Prisma generation
echo "🔧 Forcing Linux environment for Prisma generation..."
export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"

# Generate Prisma client with explicit Linux target
echo "🔨 Generating Prisma client for Linux..."
npx prisma generate

# List generated binaries
echo "📋 Generated Prisma binaries:"
ls -la node_modules/.prisma/client/libquery_engine-*

# Copy Linux binary to multiple locations
echo "📋 Copying Linux binary to multiple locations..."
cp node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/ 2>/dev/null || true
cp node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/ 2>/dev/null || true

# Create symlinks
echo "🔗 Creating symlinks..."
ln -sf node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/libquery_engine-debian-openssl-3.0.x.so.node 2>/dev/null || true

# Verify binary exists
echo "✅ Verifying binary exists:"
ls -la "$PRISMA_QUERY_ENGINE_BINARY"

# Test with Linux environment
echo "🧪 Testing Prisma with Linux environment..."
NODE_ENV=production PRISMA_QUERY_ENGINE_BINARY="$PRISMA_QUERY_ENGINE_BINARY" node -e "
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

echo "✅ Docker-based Render deployment completed successfully!" 