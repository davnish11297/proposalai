#!/bin/bash

echo "🚀 Starting minimal Render deployment for Prisma + MongoDB..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Minimal Prisma MongoDB deployment completed successfully!" 