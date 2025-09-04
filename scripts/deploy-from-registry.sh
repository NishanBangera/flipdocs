#!/bin/bash

# FlipDocs Production Deployment Script for Registry Images
# This script deploys the application using pre-built images from GitHub Container Registry

set -e

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.registry.yml"
ENV_FILE=".env.production"
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
REGISTRY="ghcr.io"
REPO_NAME="nishanbangera/flipdocs"

# Set default image names if not provided as environment variables
export API_IMAGE="${API_IMAGE:-${REGISTRY}/${REPO_NAME}-api:latest}"
export WEB_IMAGE="${WEB_IMAGE:-${REGISTRY}/${REPO_NAME}-web:latest}"

# Detect Docker Compose command
if command -v "docker-compose" > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version > /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    echo "Error: Neither 'docker-compose' nor 'docker compose' is available"
    exit 1
fi

echo "Using Docker Compose command: $DOCKER_COMPOSE"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting FlipDocs Production Deployment from Registry${NC}"
echo -e "${BLUE}API Image: ${API_IMAGE}${NC}"
echo -e "${BLUE}Web Image: ${WEB_IMAGE}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    print_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file not found: $ENV_FILE"
    print_warning "Make sure to create $ENV_FILE with production environment variables"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create backup
create_backup() {
    print_status "Creating backup..."
    
    # Backup current containers (if they exist)
    if $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps -q > /dev/null 2>&1; then
        print_status "Backing up current deployment..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps > "$BACKUP_DIR/containers_${DATE}.txt"
    fi
    
    # Backup environment file
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_DIR/.env.production_${DATE}"
    fi
    
    print_status "Backup created in $BACKUP_DIR"
}

# Function to login to registry
login_to_registry() {
    print_status "Logging into GitHub Container Registry..."
    
    # Check if GITHUB_TOKEN is available
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
    else
        print_warning "GITHUB_TOKEN not found. Attempting to pull public images..."
        print_warning "If images are private, please set GITHUB_TOKEN environment variable"
    fi
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images from registry..."
    
    # Pull individual images with better error handling
    if ! docker pull "$API_IMAGE"; then
        print_error "Failed to pull API image: $API_IMAGE"
        print_error "Make sure the image exists and you have access to it"
        return 1
    fi
    
    if ! docker pull "$WEB_IMAGE"; then
        print_error "Failed to pull Web image: $WEB_IMAGE"
        print_error "Make sure the image exists and you have access to it"
        return 1
    fi
    
    # Also pull redis image
    docker pull redis:7-alpine
    docker pull nginx:alpine
    
    print_status "All images pulled successfully"
}

# Function to stop existing services
stop_services() {
    print_status "Stopping existing services..."
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
}

# Function to start services
start_services() {
    print_status "Starting services with registry images..."
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" up -d
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait for services to be ready
    print_status "Waiting for services to initialize..."
    sleep 30
    
    # Check if containers are running
    if ! $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps | grep -q "Up"; then
        print_error "Some containers are not running properly"
        show_logs
        return 1
    fi
    
    # Try to check health endpoints with retries
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        # Check nginx is responding
        if curl -f http://localhost/health > /dev/null 2>&1; then
            print_status "✅ Nginx service is healthy"
            break
        elif [ $retry_count -eq $((max_retries - 1)) ]; then
            print_error "❌ Nginx service health check failed after $max_retries attempts"
            return 1
        else
            print_warning "Nginx not ready yet, retrying in 10 seconds... ($((retry_count + 1))/$max_retries)"
            sleep 10
            ((retry_count++))
        fi
    done
    
    # Check API service through nginx proxy
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_status "✅ API service is healthy"
    else
        print_warning "⚠️  API service health check failed"
    fi
    
    print_status "Deployment health check completed!"
}

# Function to cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    print_status "Cleanup completed"
}

# Function to show logs
show_logs() {
    print_status "Recent logs:"
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" logs --tail=50
}

# Function to show service status
show_status() {
    echo -e "\n${GREEN}Service Status:${NC}"
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" ps
    
    echo -e "\n${GREEN}Container Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to rollback
rollback() {
    print_error "Deployment failed. Rolling back..."
    $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down
    
    # Restore from backup if available
    if [ -f "$BACKUP_DIR/.env.production_${DATE}" ]; then
        cp "$BACKUP_DIR/.env.production_${DATE}" "$ENV_FILE"
    fi
    
    print_error "Rollback completed. Check the logs for more information."
}

# Main deployment process
main() {
    # Create backup
    create_backup
    
    # Login to registry
    login_to_registry
    
    # Pull latest images
    pull_images || {
        rollback
        exit 1
    }
    
    # Stop existing services
    stop_services
    
    # Start services
    start_services || {
        rollback
        exit 1
    }
    
    # Check health
    check_health || {
        print_warning "Health check had issues, but deployment may still be functional"
        print_warning "Check the logs and service status manually"
    }
    
    # Show service status
    show_status
    
    # Cleanup old images
    cleanup
    
    print_status "🎉 Registry deployment completed!"
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo "1. Test your application at http://your-domain.com"
    echo "2. Monitor logs with: $0 logs"
    echo "3. Check status with: $0 status"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "status")
        show_status
        ;;
    "stop")
        print_status "Stopping all services..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" down
        ;;
    "restart")
        print_status "Restarting all services..."
        $DOCKER_COMPOSE -f "$DOCKER_COMPOSE_FILE" restart
        ;;
    "health")
        check_health
        ;;
    "cleanup")
        cleanup
        ;;
    "pull")
        login_to_registry
        pull_images
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|restart|health|cleanup|pull}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application from registry (default)"
        echo "  logs     - Show and follow logs"
        echo "  status   - Show service status and resource usage"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  health   - Check service health"
        echo "  cleanup  - Clean up old Docker images"
        echo "  pull     - Pull latest images from registry"
        echo ""
        echo "Environment variables:"
        echo "  API_IMAGE  - Override API image (default: ghcr.io/nishanbangera/flipdocs-api:latest)"
        echo "  WEB_IMAGE  - Override Web image (default: ghcr.io/nishanbangera/flipdocs-web:latest)"
        echo "  GITHUB_TOKEN - GitHub token for private registry access"
        echo "  GITHUB_ACTOR - GitHub username for registry login"
        exit 1
        ;;
esac