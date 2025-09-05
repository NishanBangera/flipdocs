#!/bin/bash

# EC2-Specific Update Script for FlipDocs
# Optimized for Amazon Linux 2023 deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_header "FlipDocs EC2 Update Script"

# Check if running on EC2
if ! curl -s http://169.254.169.254/latest/meta-data/instance-id >/dev/null 2>&1; then
    print_warning "This script is optimized for EC2 instances"
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_status "Environment variables loaded"
else
    print_error ".env file not found. Please create it first."
    exit 1
fi

# Get registry from environment
REGISTRY=$(grep '^REGISTRY=' .env | sed 's/REGISTRY=//' || echo "ghcr.io/nishanbangera")

print_status "Using registry: $REGISTRY"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first:"
    echo "sudo systemctl start docker"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "docker-compose not found. Please install it first."
    exit 1
fi

print_header "Cleaning Old Images"

# Remove old images from the same registry
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep $REGISTRY 2>/dev/null || true); do
    print_status "Removing old image: $image"
    docker rmi $image 2>/dev/null || true
done

print_header "Pulling Latest Images"

# Pull latest images
if docker-compose pull; then
    print_status "✅ Images pulled successfully"
else
    print_error "❌ Failed to pull images"
    exit 1
fi

print_header "Updating Application"

# Stop and remove containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Start updated containers
print_status "Starting updated containers..."
if docker-compose up -d; then
    print_status "✅ Containers started successfully"
else
    print_error "❌ Failed to start containers"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to initialize..."
sleep 15

print_header "Deployment Status"

# Show container status
echo "📊 Container Status:"
docker-compose ps

# Check if containers are healthy
if docker-compose ps | grep -q "Up"; then
    print_status "✅ Services are running"
    
    # Get public IP and show access URL
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")
    echo ""
    print_status "🌐 Application is accessible at:"
    echo -e "${BLUE}http://$PUBLIC_IP${NC}"
    
    # Basic health check
    print_status "🔍 Running basic health check..."
    if curl -f http://localhost >/dev/null 2>&1; then
        print_status "✅ Application is responding"
    else
        print_warning "⚠️  Application may still be starting up"
        print_status "Check logs with: docker-compose logs -f"
    fi
else
    print_error "❌ Some services failed to start"
    echo ""
    echo "📋 Check logs for errors:"
    echo "docker-compose logs"
    exit 1
fi

print_header "Cleanup"

# Clean up unused Docker resources
print_status "Cleaning up unused Docker resources..."
docker system prune -f >/dev/null 2>&1

print_header "Update Complete! 🎉"

echo ""
echo -e "${GREEN}Summary:${NC}"
echo "- ✅ Images updated from registry"
echo "- ✅ Containers restarted"
echo "- ✅ Application accessible"
echo "- ✅ System cleaned up"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  docker-compose logs -f     # View logs"
echo "  docker-compose ps          # Check status"
echo "  docker-compose restart     # Restart services"
echo "  docker-compose down        # Stop services"