#!/bin/bash

echo "🚀 Starting simple Render deployment based on Stack Overflow solutions..."

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

echo "✅ Simple Render deployment completed successfully!" 