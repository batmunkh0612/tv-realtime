#!/bin/bash

# Firebase Storage CORS Setup Script
# This script helps you configure CORS for Firebase Storage

echo "🔥 Firebase Storage CORS Setup"
echo "================================"
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ gsutil not found. Please install Google Cloud SDK:"
    echo "   macOS: brew install google-cloud-sdk"
    echo "   Or visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gsutil found"
echo ""

# Get project ID from environment or prompt
if [ -f .env.local ]; then
    PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

if [ -z "$PROJECT_ID" ]; then
    read -p "Enter your Firebase Project ID: " PROJECT_ID
fi

if [ -z "$STORAGE_BUCKET" ]; then
    read -p "Enter your Storage Bucket name (e.g., project-id.firebasestorage.app): " STORAGE_BUCKET
fi

echo ""
echo "Project ID: $PROJECT_ID"
echo "Storage Bucket: $STORAGE_BUCKET"
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "⚠️  Not authenticated. Running: gcloud auth login"
    gcloud auth login
fi

# Set project
echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Apply CORS configuration
echo ""
echo "Applying CORS configuration..."
if [ -f firebase-storage-cors.json ]; then
    gsutil cors set firebase-storage-cors.json "gs://$STORAGE_BUCKET"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ CORS configuration applied successfully!"
        echo ""
        echo "Verifying configuration..."
        gsutil cors get "gs://$STORAGE_BUCKET"
    else
        echo ""
        echo "❌ Failed to apply CORS configuration"
        echo "Make sure you have the correct permissions and bucket name"
        exit 1
    fi
else
    echo "❌ firebase-storage-cors.json not found!"
    exit 1
fi

