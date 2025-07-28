#!/bin/bash

echo "🚀 Starting forced Render deployment with explicit binary path..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Forced Render deployment completed successfully!" 