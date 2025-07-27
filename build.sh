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