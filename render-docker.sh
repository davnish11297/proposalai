#!/bin/bash

echo "🚀 Starting Docker-based Render deployment for Linux environment..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Verify the build
echo "✅ Verifying build..."
ls -la dist/
ls -la dist/utils/

echo "✅ Docker-based Render deployment completed successfully!" 