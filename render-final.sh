#!/bin/bash

echo "🚀 Starting final Render deployment with comprehensive Prisma fix..."

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

# Copy ALL binaries to multiple locations
echo "📋 Copying ALL binaries to multiple locations..."
cp node_modules/.prisma/client/libquery_engine-* node_modules/@prisma/client/ 2>/dev/null || true
cp node_modules/.prisma/client/libquery_engine-* node_modules/ 2>/dev/null || true

# Create symlinks for all binaries
echo "🔗 Creating symlinks for all binaries..."
for binary in node_modules/.prisma/client/libquery_engine-*; do
  if [ -f "$binary" ]; then
    filename=$(basename "$binary")
    ln -sf "$binary" "node_modules/@prisma/client/$filename" 2>/dev/null || true
    ln -sf "$binary" "node_modules/$filename" 2>/dev/null || true
    echo "✅ Created symlink for $filename"
  fi
done

# Set environment variable to the most compatible binary
if [ -f "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node" ]; then
  export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node"
  echo "🔧 Using debian-openssl-3.0.x binary"
elif [ -f "node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node" ]; then
  export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node"
  echo "🔧 Using linux-musl-openssl-3.0.x binary"
elif [ -f "node_modules/.prisma/client/libquery_engine-linux-musl.so.node" ]; then
  export PRISMA_QUERY_ENGINE_BINARY="node_modules/.prisma/client/libquery_engine-linux-musl.so.node"
  echo "🔧 Using linux-musl binary"
else
  echo "⚠️  No compatible binary found, will let Prisma auto-detect"
fi

# Verify binary exists
if [ ! -z "$PRISMA_QUERY_ENGINE_BINARY" ]; then
  echo "✅ Verifying binary exists:"
  ls -la "$PRISMA_QUERY_ENGINE_BINARY"
fi

# Test with environment variable set
echo "🧪 Testing Prisma with explicit binary path..."
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

echo "✅ Final Render deployment build completed successfully!" 