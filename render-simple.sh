#!/bin/bash

echo "🚀 Starting Render deployment with Prisma schema copied BEFORE npm install..."

# Navigate to server directory
cd src/server

# Copy Prisma schema FIRST (before npm install)
echo "📋 Setting up Prisma schema BEFORE npm install..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Install dependencies (Prisma client will be generated during install)
echo "📥 Installing dependencies..."
npm install

# List generated binaries
echo "📋 Generated Prisma binaries:"
ls -la node_modules/.prisma/client/libquery_engine-*

# Copy both binaries to the expected location
echo "📋 Copying binaries to expected location..."
cp node_modules/.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node node_modules/@prisma/client/ 2>/dev/null || true
cp node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/ 2>/dev/null || true

# Verify binaries exist
echo "✅ Verifying binaries exist:"
ls -la node_modules/@prisma/client/libquery_engine-debian-openssl-*.so.node 2>/dev/null || echo "Binaries not found in @prisma/client"

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Render deployment completed successfully!" 