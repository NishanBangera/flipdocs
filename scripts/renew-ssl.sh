#!/bin/bash

# FlipDocs SSL Certificate Renewal Script
# This script renews Let's Encrypt SSL certificates automatically

set -e

DOMAIN="flipbook.ironasylum.in"
COMPOSE_FILE="docker-compose.ssl.yml"

echo "🔄 FlipDocs SSL Certificate Renewal"
echo "===================================="
echo "Domain: $DOMAIN"
echo "Date: $(date)"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Check if the SSL compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found"
    exit 1
fi

# Renew certificates
echo "🔐 Renewing SSL certificates..."
docker-compose -f $COMPOSE_FILE run --rm certbot renew

# Check renewal result
if [ $? -eq 0 ]; then
    echo "✅ Certificate renewal completed successfully!"
    
    # Reload nginx to use new certificates
    echo "🔄 Reloading nginx configuration..."
    docker-compose -f $COMPOSE_FILE exec nginx nginx -s reload
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx reloaded successfully!"
        echo "📧 Sending renewal notification..."
        
        # Optional: Send notification (uncomment if you have a notification system)
        # curl -X POST "your-webhook-url" -d "SSL certificates for $DOMAIN renewed successfully"
        
    else
        echo "⚠️  Warning: Nginx reload failed, but certificates were renewed"
    fi
else
    echo "❌ Certificate renewal failed!"
    echo "📧 Sending failure notification..."
    
    # Optional: Send failure notification (uncomment if you have a notification system)
    # curl -X POST "your-webhook-url" -d "SSL certificate renewal failed for $DOMAIN"
    
    exit 1
fi

echo ""
echo "🔍 Certificate status:"
docker-compose -f $COMPOSE_FILE exec certbot certbot certificates

echo ""
echo "✨ Renewal process completed at $(date)"