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

# Also copy to the root of node_modules for Render
echo "📋 Copying binaries to node_modules root..."
cp node_modules/.prisma/client/libquery_engine-* node_modules/ 2>/dev/null || true

# Create symlinks if needed
echo "🔗 Creating symlinks..."
ln -sf node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/libquery_engine-debian-openssl-3.0.x.so.node 2>/dev/null || true

# Verify binaries are in place
echo "✅ Verifying binaries in @prisma/client:"
ls -la node_modules/@prisma/client/libquery_engine-* 2>/dev/null || echo "No binaries found in @prisma/client"

# Check what's in the .prisma directory
echo "📋 Contents of .prisma/client:"
ls -la node_modules/.prisma/client/

# Test Prisma connection with our custom client
echo "🧪 Testing Prisma connection..."
node -e "
const { connectDatabase } = require('./utils/prismaClient');
connectDatabase()
  .then(() => {
    console.log('✅ Prisma connection successful');
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