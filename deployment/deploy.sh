#!/bin/bash

# FlipDocs GHCR-Only Deployment Script
# This script deploys FlipDocs using only pre-built images from GitHub Container Registry

set -e

# Configuration
REPO_OWNER="nishanbangera"
REPO_NAME="flipdocs"
REGISTRY="ghcr.io"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Colors
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

# Detect Docker Compose command
if command -v "docker-compose" > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    print_error "Neither 'docker-compose' nor 'docker compose' is available"
    exit 1
fi

print_header "FlipDocs GHCR Deployment"
print_status "Using Docker Compose command: $DOCKER_COMPOSE"

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to login to GHCR
login_ghcr() {
    print_status "Logging into GitHub Container Registry..."
    
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USERNAME" --password-stdin
        print_status "Successfully logged into GHCR"
    else
        print_warning "GITHUB_TOKEN not set. Attempting to pull public images..."
        print_warning "If images are private, set GITHUB_TOKEN and GITHUB_USERNAME environment variables"
    fi
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest images from GHCR..."
    
    local api_image="${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-api:latest"
    local web_image="${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-web:latest"
    
    print_status "Pulling API image: $api_image"
    if ! docker pull "$api_image"; then
        print_error "Failed to pull API image. Make sure it exists and you have access."
        return 1
    fi
    
    print_status "Pulling Web image: $web_image"
    if ! docker pull "$web_image"; then
        print_error "Failed to pull Web image. Make sure it exists and you have access."
        return 1
    fi
    
    # Pull other required images
    docker pull redis:7-alpine
    docker pull nginx:alpine
    
    print_status "All images pulled successfully"
}

# Function to update docker-compose with latest images
update_compose_images() {
    print_status "Updating docker-compose.yml with latest image tags..."
    
    # Use sed to update image tags (works on both Linux and macOS)
    sed -i.bak "s|image: ${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-api:.*|image: ${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-api:latest|g" "$DOCKER_COMPOSE_FILE"
    sed -i.bak "s|image: ${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-web:.*|image: ${REGISTRY}/${REPO_OWNER}/${REPO_NAME}-web:latest|g" "$DOCKER_COMPOSE_FILE"
    
    # Remove backup file
    rm -f "${DOCKER_COMPOSE_FILE}.bak"
}

# Function to check environment file
check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file not found: $ENV_FILE"
        print_error "Please create $ENV_FILE with your production environment variables"
        print_error "You can use .env.production.template as a starting point"
        exit 1
    fi
    
    # Check for required variables
    local required_vars=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY" "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_KEY")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" || grep -q "^${var}=your_" "$ENV_FILE" || grep -q "^${var}=.*xxxxxxxx" "$ENV_FILE"; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_warning "The following required environment variables need to be configured:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_warning "Please update $ENV_FILE before deploying"
    fi
}

# Function to deploy
deploy() {
    print_header "Starting Deployment"
    
    # Stop existing services
    print_status "Stopping existing services..."
    $DOCKER_COMPOSE down --remove-orphans 2>/dev/null || true
    
    # Start services
    print_status "Starting services..."
    $DOCKER_COMPOSE up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to initialize..."
    sleep 30
    
    # Check if containers are running
    if $DOCKER_COMPOSE ps | grep -q "Up"; then
        print_status "✅ Services are running"
    else
        print_error "❌ Some services failed to start"
        $DOCKER_COMPOSE logs
        return 1
    fi
}

# Function to check health
check_health() {
    print_status "Checking service health..."
    
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            print_status "✅ Application is healthy and responding"
            return 0
        fi
        
        if [ $retry_count -eq $((max_retries - 1)) ]; then
            print_warning "⚠️  Health check failed, but services may still be starting"
            print_warning "Check logs with: $0 logs"
            return 1
        fi
        
        print_status "Health check attempt $((retry_count + 1))/$max_retries - retrying in 10 seconds..."
        sleep 10
        ((retry_count++))
    done
}

# Function to show status
show_status() {
    print_header "Service Status"
    $DOCKER_COMPOSE ps
    
    echo
    print_header "Container Resource Usage"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || echo "Docker stats not available"
}

# Function to show logs
show_logs() {
    print_header "Service Logs"
    $DOCKER_COMPOSE logs --tail=50 -f
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    docker system prune -f
}

# Main deployment function
main_deploy() {
    check_docker
    check_env_file
    login_ghcr
    pull_images
    update_compose_images
    deploy
    check_health
    show_status
    cleanup
    
    print_header "Deployment Complete! 🎉"
    echo -e "${GREEN}Your FlipDocs application is running at:${NC}"
    echo -e "${BLUE}http://localhost${NC} (or your domain if configured)"
    echo
    echo -e "${GREEN}Useful commands:${NC}"
    echo "  $0 logs    - View logs"
    echo "  $0 status  - Check status"
    echo "  $0 stop    - Stop services"
    echo "  $0 restart - Restart services"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main_deploy
        ;;
    "pull")
        check_docker
        login_ghcr
        pull_images
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        print_status "Stopping all services..."
        $DOCKER_COMPOSE down
        ;;
    "restart")
        print_status "Restarting all services..."
        $DOCKER_COMPOSE restart
        ;;
    "health")
        check_health
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|pull|logs|status|stop|restart|health|cleanup}"
        echo
        echo "Commands:"
        echo "  deploy   - Full deployment (pull images + deploy)"
        echo "  pull     - Pull latest images from GHCR"
        echo "  logs     - Show and follow logs"
        echo "  status   - Show service status"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  health   - Check service health"
        echo "  cleanup  - Clean up old Docker images"
        echo
        echo "Environment Variables:"
        echo "  GITHUB_TOKEN    - GitHub token for private registry access"
        echo "  GITHUB_USERNAME - GitHub username for registry login"
        exit 1
        ;;
esac