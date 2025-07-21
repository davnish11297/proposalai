#!/bin/bash

# Script to disable rate limiting in development
echo "🔧 Disabling rate limiting in development..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating one..."
    cp env.example .env
fi

# Add or update the rate limiting disable setting
if grep -q "DISABLE_RATE_LIMITING_IN_DEV" .env; then
    # Update existing setting
    sed -i '' 's/DISABLE_RATE_LIMITING_IN_DEV=.*/DISABLE_RATE_LIMITING_IN_DEV=true/' .env
else
    # Add new setting
    echo "DISABLE_RATE_LIMITING_IN_DEV=true" >> .env
fi

echo "✅ Rate limiting disabled in development mode"
echo "🔄 Please restart your server with: npm run dev" 