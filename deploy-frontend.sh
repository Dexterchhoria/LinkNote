#!/bin/bash

# Frontend Deployment Script for S3 + CloudFront

# Configuration
S3_BUCKET="linknote-frontend"
CLOUDFRONT_DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"
BUILD_DIR="frontend-react/dist"

echo "🚀 Starting frontend deployment..."

# Build the frontend
echo "📦 Building React application..."
cd frontend-react
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Upload to S3
echo "☁️  Uploading to S3..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

if [ $? -ne 0 ]; then
    echo "❌ S3 upload failed!"
    exit 1
fi

echo "✅ Upload to S3 successful!"

# Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

if [ $? -ne 0 ]; then
    echo "⚠️  CloudFront invalidation failed (you may need to do this manually)"
else
    echo "✅ CloudFront cache invalidated!"
fi

echo "🎉 Frontend deployment complete!"
echo "🌐 Your app will be available at: https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net"
