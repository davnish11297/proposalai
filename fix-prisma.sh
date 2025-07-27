#!/bin/bash

echo "🔧 Fixing Prisma binary targets..."

# Navigate to project root
cd /Users/davnishsingh/Documents/proposalai-main/proposalai

# Remove existing Prisma client
echo "🗑️  Removing existing Prisma client..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Regenerate Prisma client with correct binary targets
echo "🔨 Regenerating Prisma client..."
npx prisma generate

echo "✅ Prisma client regenerated successfully!"
echo "🚀 You can now deploy to Render without binary target issues." 