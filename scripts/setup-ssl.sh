#!/bin/bash

# FlipDocs SSL Certificate Setup Script
# This script sets up Let's Encrypt SSL certificates for flipbook.ironasylum.in

set -e

DOMAIN="flipbook.ironasylum.in"
EMAIL=${SSL_EMAIL:-"admin@ironasylum.in"}
DRY_RUN=${1:-"--dry-run"}

echo "🔒 FlipDocs SSL Certificate Setup"
echo "================================="
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
if [ ! -f "docker-compose.ssl.yml" ]; then
    echo "❌ Error: docker-compose.ssl.yml not found"
    exit 1
fi

# Create necessary directories
echo "📁 Creating certificate directories..."
mkdir -p certbot/www
mkdir -p certbot/conf

# Start nginx with initial configuration
echo "🚀 Starting nginx with initial configuration..."
docker-compose -f docker-compose.ssl.yml up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Generate SSL certificate
echo "🔐 Generating SSL certificate..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🧪 Running in dry-run mode (test mode)..."
    docker-compose -f docker-compose.ssl.yml run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --dry-run --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
else
    echo "🎯 Running in production mode..."
    docker-compose -f docker-compose.ssl.yml run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $DOMAIN -d www.$DOMAIN
fi

if [ $? -eq 0 ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "✅ Dry run successful! You can now run without --dry-run flag:"
        echo "   bash scripts/setup-ssl.sh --force-renewal"
    else
        echo "✅ SSL certificate generated successfully!"
        echo "📝 Next steps:"
        echo "   1. Update nginx.conf with HTTPS configuration"
        echo "   2. Restart the services: docker-compose -f docker-compose.ssl.yml restart"
    fi
else
    echo "❌ Certificate generation failed!"
    exit 1
fi

echo ""
echo "🔍 Certificate files location:"
echo "   - Full chain: certbot/conf/live/$DOMAIN/fullchain.pem"
echo "   - Private key: certbot/conf/live/$DOMAIN/privkey.pem"