#!/bin/bash

# FlipDocs SSL Certificate Setup Script
# This script sets up Let's Encrypt SSL certificates for flipbook.ironasylum.in
# Designed for EC2 deployment with GHCR container images

set -e

DOMAIN="flipbook.ironasylum.in"
EMAIL=${SSL_EMAIL:-"admin@ironasylum.in"}
DRY_RUN=${1:-"--dry-run"}
COMPOSE_FILE="docker-compose.ssl.yml"

echo "🔒 FlipDocs SSL Certificate Setup (GHCR Deployment)"
echo "===================================================="
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Mode: $DRY_RUN"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Check if the SSL compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found"
    echo "📝 Make sure you have the deployment files on your EC2 instance"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "📝 Please copy .env.ssl.example to .env and configure it"
    exit 1
fi

# Create necessary directories
echo "📁 Creating certificate directories..."
mkdir -p certbot/www
mkdir -p certbot/conf
mkdir -p data/storage

# Pull latest images from GHCR
echo "📦 Pulling latest container images from GHCR..."
docker-compose -f $COMPOSE_FILE pull

# Start nginx with initial configuration
echo "🚀 Starting nginx with initial configuration..."
docker-compose -f $COMPOSE_FILE up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Check if nginx is responding
if ! curl -f http://localhost/.well-known/acme-challenge/ 2>/dev/null; then
    echo "⚠️  Note: Nginx ACME challenge endpoint check failed, but continuing..."
fi

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🧪 Running in dry-run mode (test mode)..."
    docker-compose -f $COMPOSE_FILE run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --dry-run --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
else
    echo "🎯 Running in production mode..."
    docker-compose -f $COMPOSE_FILE run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
fi

if [ $? -eq 0 ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "✅ Dry run successful! You can now run without --dry-run flag:"
        echo "   bash setup-ssl.sh --force-renewal"
    else
        echo "✅ SSL certificate generated successfully!"
        echo "📝 Next steps:"
        echo "   1. Copy nginx.domain.conf to nginx.conf: cp nginx.domain.conf nginx.conf"
        echo "   2. Restart all services: docker-compose -f $COMPOSE_FILE restart"
        echo "   3. Start all services: docker-compose -f $COMPOSE_FILE up -d"
    fi
else
    echo "❌ Certificate generation failed!"
    echo "🔍 Check the logs: docker-compose -f $COMPOSE_FILE logs certbot"
    exit 1
fi

echo ""
echo "🔍 Certificate files location:"
echo "   - Full chain: certbot/conf/live/$DOMAIN/fullchain.pem"
echo "   - Private key: certbot/conf/live/$DOMAIN/privkey.pem"
echo ""
echo "🌐 After successful setup, your application will be available at:"
echo "   https://$DOMAIN"