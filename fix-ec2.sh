#!/bin/bash
# Fix EC2 Environment - Sets correct external API URL for browser access

echo "🔧 Fixing FlipDocs environment variables for external access..."

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "📍 EC2 Public IP: $PUBLIC_IP"

# Stop containers first
echo "🛑 Stopping containers..."
docker-compose down

# Update .env file with correct external API URL
echo "🔄 Updating .env file..."

# Backup current .env
cp .env .env.backup

# Create updated .env with correct external API URL
cat > .env << EOF
REGISTRY=ghcr.io/nishanbangera
API_IMAGE=flipdocs-api:latest
WEB_IMAGE=flipdocs-web:latest

# Application Port
PORT=80

# Clerk Authentication - Working test keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG91Y2hpbmctZ2Vja28tNTkuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_erSgzHYJ6mDk2ciU7GogysaC2LVvwVhwCFGPDGHHdo

# Supabase Database - Working keys
NEXT_PUBLIC_SUPABASE_URL=https://chlbfyrtsakyvfhecwrv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobGJmeXJ0c2FreXZmaGVjd3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzI4MjYsImV4cCI6MjA3MjEwODgyNn0.CGCdj8zemZSNcW7zxvAbW0glAJAY1UROljXgCVqgvbo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobGJmeXJ0c2FreXZmaGVjd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzMjgyNiwiZXhwIjoyMDcyMTA4ODI2fQ._wYBD7bAIxRUUwY3y_D18PoScq9AjsOCLc-9lJ1CyB8

# API Configuration - EXTERNAL IP for browser access (FIXED!)
NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:3001
NEXT_PUBLIC_APP_URL=http://$PUBLIC_IP
FRONTEND_URL=http://$PUBLIC_IP

# Optional
TZ=UTC
EOF

echo "📋 Updated environment variables:"
echo "   NEXT_PUBLIC_API_URL=http://$PUBLIC_IP:3001"
echo "   NEXT_PUBLIC_APP_URL=http://$PUBLIC_IP"
echo "   FRONTEND_URL=http://$PUBLIC_IP"

# Restart containers with new environment
echo "🔄 Starting containers with fixed environment..."
docker-compose up -d

# Wait for containers to start
echo "⏳ Waiting for containers to start..."
sleep 15

# Check container status
echo "📊 Container status:"
docker-compose ps

# Test endpoints
echo "🔍 Testing endpoints:"
echo "API Health: $(curl -s http://localhost/api/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo 'Not responding')"
echo "Web Status: $(curl -s -o /dev/null -w '%{http_code}' http://localhost 2>/dev/null || echo 'Not responding')"

echo "✅ Fix complete!"
echo "🌐 Your application should now be accessible at: http://$PUBLIC_IP"
echo "🔗 API endpoint: http://$PUBLIC_IP/api/"

echo ""
echo "🔍 If still having issues, check web container logs:"
echo "   docker-compose logs web"
