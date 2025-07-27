#!/bin/bash

echo "🚀 ProposalAI Backend Deployment Script"
echo "======================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "📦 Preparing backend for deployment..."

# Navigate to backend directory
cd src/server

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway login
railway init
railway up

echo "✅ Backend deployed successfully!"
echo "🔗 Your backend URL: https://your-app-name.railway.app"
echo ""
echo "📝 Next steps:"
echo "1. Copy your backend URL"
echo "2. Update netlify.toml with your backend URL"
echo "3. Set environment variables in Railway dashboard"
echo "4. Redeploy frontend to Netlify" 