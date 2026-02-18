#!/bin/bash

# AWS S3 + CloudFront Deployment Script for Household Services React App
# This script builds the React app and deploys it to AWS S3 with CloudFront invalidation

set -e  # Exit on any error

# Configuration - Update these with your AWS resources
S3_BUCKET="household-services-prod"
CLOUDFRONT_DISTRIBUTION_ID="E1234567890ABC"
AWS_REGION="us-east-1"
BUILD_DIR="dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting deployment of Household Services React App${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "Install with: curl \"https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip\" -o \"awscliv2.zip\" && unzip awscliv2.zip && sudo ./aws/install"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --only=production

echo -e "${YELLOW}🔧 Building the application...${NC}"
npm run build

# Check if build was successful
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Build failed - $BUILD_DIR directory not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Build completed successfully${NC}"

# Create backup of current deployment (optional)
echo -e "${YELLOW}💾 Creating backup of current deployment...${NC}"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
aws s3 sync s3://$S3_BUCKET s3://$S3_BUCKET-backups/$BACKUP_DIR --delete --region $AWS_REGION || echo "No existing deployment to backup"

echo -e "${YELLOW}☁️  Uploading to S3 bucket: $S3_BUCKET${NC}"

# Upload HTML files with no-cache headers
aws s3 sync $BUILD_DIR s3://$S3_BUCKET \
  --region $AWS_REGION \
  --delete \
  --exclude "*.js" \
  --exclude "*.css" \
  --exclude "*.png" \
  --exclude "*.jpg" \
  --exclude "*.jpeg" \
  --exclude "*.gif" \
  --exclude "*.svg" \
  --exclude "*.ico" \
  --exclude "*.woff*" \
  --exclude "*.ttf" \
  --cache-control "no-cache, no-store, must-revalidate"

# Upload static assets with long-term caching
aws s3 sync $BUILD_DIR s3://$S3_BUCKET \
  --region $AWS_REGION \
  --exclude "*.html" \
  --exclude "*.xml" \
  --exclude "*.txt" \
  --cache-control "public, max-age=31536000, immutable"

# Set correct content type for specific files
aws s3 cp s3://$S3_BUCKET/index.html s3://$S3_BUCKET/index.html \
  --region $AWS_REGION \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

echo -e "${GREEN}✅ Upload to S3 completed${NC}"

# Invalidate CloudFront cache
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}🔄 Invalidating CloudFront cache...${NC}"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region $AWS_REGION)
    
    echo -e "${BLUE}📋 CloudFront invalidation ID: $INVALIDATION_ID${NC}"
    echo -e "${YELLOW}⏳ Waiting for invalidation to complete...${NC}"
    
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --id $INVALIDATION_ID \
        --region $AWS_REGION
    
    echo -e "${GREEN}✅ CloudFront invalidation completed${NC}"
else
    echo -e "${YELLOW}⚠️  CloudFront distribution ID not set, skipping cache invalidation${NC}"
fi

# Get CloudFront URL
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    CLOUDFRONT_URL=$(aws cloudfront get-distribution \
        --id $CLOUDFRONT_DISTRIBUTION_ID \
        --query 'Distribution.DomainName' \
        --output text \
        --region $AWS_REGION)
    echo -e "${GREEN}🌐 Application deployed to: https://$CLOUDFRONT_URL${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "  • S3 Bucket: $S3_BUCKET"
echo -e "  • CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo -e "  • Build Directory: $BUILD_DIR"
echo -e "  • Backup Created: $BACKUP_DIR"
echo -e "  • Deployment Time: $(date)"

# Health check (optional)
echo -e "${YELLOW}🏥 Performing health check...${NC}"
if [ ! -z "$CLOUDFRONT_URL" ]; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$CLOUDFRONT_URL)
    if [ $HTTP_STATUS -eq 200 ]; then
        echo -e "${GREEN}✅ Health check passed (HTTP $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}❌ Health check failed (HTTP $HTTP_STATUS)${NC}"
    fi
fi

echo -e "${GREEN}🚀 Deployment script completed!${NC}"