#!/bin/bash

echo "🚀 Starting Render deployment with native MongoDB..."

# Navigate to server directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

echo "✅ Native MongoDB deployment completed successfully!" 