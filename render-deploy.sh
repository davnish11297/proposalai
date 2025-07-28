#!/bin/bash

echo "🚀 Starting Render deployment with MongoDB..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Render deployment build completed successfully!" 