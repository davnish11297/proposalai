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

# Build TypeScript with explicit output
echo "🔨 Building TypeScript..."
npx tsc -p tsconfig.json --listFiles

# Verify the build
echo "✅ Verifying build..."
echo "📁 Checking dist directory:"
ls -la dist/

echo "📁 Checking utils directory:"
ls -la dist/utils/

echo "📄 Checking mongoClient.js exists:"
if [ -f "dist/utils/mongoClient.js" ]; then
    echo "✅ mongoClient.js found"
    echo "📄 File size: $(wc -c < dist/utils/mongoClient.js) bytes"
else
    echo "❌ mongoClient.js NOT found!"
    echo "📁 Available files in utils:"
    ls -la dist/utils/
    exit 1
fi

echo "📄 Checking index.js imports:"
grep -n "mongoClient" dist/index.js || echo "No mongoClient import found in index.js"

echo "✅ Docker-based Render deployment completed successfully!" 