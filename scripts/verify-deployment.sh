#!/bin/bash

# FlipDocs Deployment Verification Script
# Quick health check script for your EC2 deployment

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔍 FlipDocs Deployment Verification${NC}"
echo "Testing deployment at: http://13.235.75.33"
echo ""

# Test functions
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "✅ ${GREEN}$name${NC} - OK"
        return 0
    else
        echo -e "❌ ${RED}$name${NC} - FAILED"
        return 1
    fi
}

# Run tests
echo "Testing endpoints..."
echo ""

test_endpoint "http://13.235.75.33/health" "Nginx Health Check"
test_endpoint "http://13.235.75.33/api/health" "API Health Check"
test_endpoint "http://13.235.75.33/" "Main Application"

echo ""
echo -e "${YELLOW}Note:${NC} If any tests fail, check:"
echo "1. Services are running: docker compose -f docker-compose.prod.yml ps"
echo "2. View logs: docker compose -f docker-compose.prod.yml logs"
echo "3. Check EC2 security groups allow HTTP traffic on port 80"
echo ""

# Check if running from EC2 instance
if command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker Status:${NC}"
    docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Docker Compose not running in current directory"
fi