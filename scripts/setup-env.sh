#!/bin/bash

# FlipDocs EC2 Environment Setup Script
# This script helps set up environment variables on EC2

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔧 FlipDocs EC2 Environment Setup${NC}"

# Check if .env.production already exists
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production already exists${NC}"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get EC2 public IP automatically
EC2_IP=$(curl -s http://checkip.amazonaws.com/ || echo "UNKNOWN")

echo -e "${GREEN}Detected EC2 IP: $EC2_IP${NC}"

# Create .env.production file
cat > .env.production << EOF
# Production Environment Variables for FlipDocs
# This file is used by Docker Compose for production deployment

# Application Environment
NODE_ENV=production
PORT=3000

# Supabase Configuration (Replace with your actual values)
SUPABASE_URL=https://chlbfyrtsakyvfhecwrv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobGJmeXJ0c2FreXZmaGVjd3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzI4MjYsImV4cCI6MjA3MjEwODgyNn0.CGCdj8zemZSNcW7zxvAbW0glAJAY1UROljXgCVqgvbo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobGJmeXJ0c2FreXZmaGVjd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMjgyNiwiZXhwIjoyMDcyMTA4ODI2fQ._wYBD7bAIxRUUwY3y_D18PoScq9AjsOCLc-9lJ1CyB8

# Authentication (Clerk) - Use test keys for development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3VyZS1raWxsZGVlci05My5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_CSxzwxx97lhcaOSL15ZSQ7XoyLwNhS0v2N4OeDsWhH
# CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# API Configuration
NEXT_PUBLIC_API_URL=http://$EC2_IP
API_URL=http://api:3001

# Redis Configuration (using Docker service)
REDIS_URL=redis://redis:6379

# File Upload Configuration
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,doc,docx,ppt,pptx

# Production
LOG_LEVEL=warn
LOG_FORMAT=json

# Health Check
HEALTH_CHECK_INTERVAL=30000

# Domain Configuration
NEXT_PUBLIC_DOMAIN=http://$EC2_IP
ALLOWED_ORIGINS=http://$EC2_IP
EOF

echo -e "${GREEN}✅ .env.production created successfully!${NC}"
echo -e "${YELLOW}📝 Remember to update any credentials if needed${NC}"
echo ""
echo "File location: $(pwd)/.env.production"
echo "EC2 IP used: $EC2_IP"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Review the .env.production file"
echo "2. Run: ./scripts/deploy.sh"