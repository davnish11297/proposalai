#!/bin/bash

echo "🚀 Starting Render deployment with basic Prisma for MongoDB..."

# Navigate to server directory
cd src/server

# Copy Prisma schema
echo "📋 Setting up Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma ./prisma/schema.prisma

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Basic Prisma MongoDB deployment completed successfully!" 