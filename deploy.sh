#!/bin/bash

# Quick Deploy Script for Real-Time TV App
# This script helps you deploy to Vercel quickly

echo "🚀 Real-Time TV Deployment Script"
echo "=================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

echo ""
echo "🏗️  Building the app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check errors above."
    exit 1
fi

echo ""
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📺 To use on Smart TV:"
echo "   1. Copy the URL shown above"
echo "   2. Add ?user=user1 (or your user ID) to the end"
echo "   3. Open it in your Smart TV browser"
echo ""
echo "💡 Example: https://your-app.vercel.app/?user=user1"
echo ""

