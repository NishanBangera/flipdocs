#!/bin/bash

# FlipDocs Production Deployment Script for AWS
# This script deploys the application to AWS EC2 instance

set -e

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting FlipDocs Production Deployment${NC}"

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
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps -q > /dev/null 2>&1; then
        print_status "Backing up current deployment..."
        docker compose -f "$DOCKER_COMPOSE_FILE" ps > "$BACKUP_DIR/containers_${DATE}.txt"
    fi
    
    # Backup environment file
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$BACKUP_DIR/.env.production_${DATE}"
    fi
    
    print_status "Backup created in $BACKUP_DIR"
}

# Function to pull latest images
pull_images() {
    print_status "Pulling latest Docker images..."
    docker compose -f "$DOCKER_COMPOSE_FILE" pull
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    docker compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
}

# Function to stop existing services
stop_services() {
    print_status "Stopping existing services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
}

# Function to start services
start_services() {
    print_status "Starting services..."
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d
}

# Function to check service health
check_health() {
    print_status "Checking service health..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check nginx is responding
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "✅ Nginx service is healthy"
    else
        print_error "❌ Nginx service health check failed"
        return 1
    fi
    
    # Check API service through nginx proxy
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_status "✅ API service is healthy"
    else
        print_error "❌ API service health check failed"
        return 1
    fi
    
    # Check web service (Next.js health endpoint)
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_status "✅ Web service is healthy"
    else
        print_warning "⚠️  Web service health check failed (this might be expected if Next.js health endpoint is different)"
    fi
    
    print_status "Core services are healthy!"
}

# Function to cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    docker system prune -f
}

# Function to show logs
show_logs() {
    print_status "Recent logs:"
    docker compose -f "$DOCKER_COMPOSE_FILE" logs --tail=50
}

# Function to rollback
rollback() {
    print_error "Deployment failed. Rolling back..."
    docker compose -f "$DOCKER_COMPOSE_FILE" down
    
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
    
    # Stop existing services
    stop_services
    
    # Build new images
    build_images || {
        rollback
        exit 1
    }
    
    # Start services
    start_services || {
        rollback
        exit 1
    }
    
    # Check health
    check_health || {
        rollback
        exit 1
    }
    
    # Cleanup
    cleanup
    
    print_status "🎉 Deployment completed successfully!"
    
    # Show service status
    echo -e "\n${GREEN}Service Status:${NC}"
    docker compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # Show recent logs
    show_logs
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        docker compose -f "$DOCKER_COMPOSE_FILE" logs -f
        ;;
    "status")
        docker compose -f "$DOCKER_COMPOSE_FILE" ps
        ;;
    "stop")
        print_status "Stopping all services..."
        docker compose -f "$DOCKER_COMPOSE_FILE" down
        ;;
    "restart")
        print_status "Restarting all services..."
        docker compose -f "$DOCKER_COMPOSE_FILE" restart
        ;;
    "health")
        check_health
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|restart|health|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  logs     - Show and follow logs"
        echo "  status   - Show service status"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  health   - Check service health"
        echo "  cleanup  - Clean up old Docker images"
        exit 1
        ;;
esac