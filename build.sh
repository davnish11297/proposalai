#!/bin/bash

echo "🚀 Starting build process for Render deployment..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Copy Prisma schema to server directory
echo "📋 Copying Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client with correct binary targets
echo "🔨 Generating Prisma client..."
npx prisma generate

# Verify the binary was created
echo "🔍 Verifying Prisma binary..."
ls -la node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node

# Copy binary to ensure it's in the right place
echo "📋 Ensuring binary is in deployment folder..."
cp node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/@prisma/client/

# Test Prisma setup
echo "🧪 Testing Prisma setup..."
node ../../test-prisma.js

# Verify Prisma client was generated
echo "✅ Verifying Prisma client..."
ls -la node_modules/.prisma/client/

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Build completed successfully!" 