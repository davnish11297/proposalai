#!/bin/bash

echo "🚀 Starting Docker-based Render deployment for Linux environment..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Docker-based Render deployment completed successfully!" 