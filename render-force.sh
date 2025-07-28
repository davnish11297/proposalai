#!/bin/bash

echo "🚀 Starting forced Render deployment with explicit binary path..."

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

# Copy both binaries to multiple locations
echo "📋 Copying binaries to multiple locations..."
cp node_modules/.prisma/client/libquery_engine-debian-openssl-*.so.node node_modules/@prisma/client/ 2>/dev/null || true
cp node_modules/.prisma/client/libquery_engine-debian-openssl-*.so.node node_modules/ 2>/dev/null || true

# Create symlinks
echo "🔗 Creating symlinks..."
ln -sf node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/libquery_engine-debian-openssl-3.0.x.so.node 2>/dev/null || true

# Set environment variable explicitly
export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"
echo "🔧 Set PRISMA_QUERY_ENGINE_BINARY to: $PRISMA_QUERY_ENGINE_BINARY"

# Verify binary exists
echo "✅ Verifying binary exists:"
ls -la "$PRISMA_QUERY_ENGINE_BINARY"

# Test with forced environment
echo "🧪 Testing Prisma with forced binary path..."
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

echo "✅ Forced Render deployment completed successfully!" 