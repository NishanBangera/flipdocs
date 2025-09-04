#!/bin/bash

# SSL Certificate Setup Script for FlipDocs
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-your-domain.com}"
EMAIL="${2:-admin@your-domain.com}"

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

if [ "$#" -ne 2 ]; then
    print_error "Usage: $0 <domain> <email>"
    print_error "Example: $0 flipdocs.com admin@flipdocs.com"
    exit 1
fi

print_status "🔒 Setting up SSL certificates for $DOMAIN"

# Stop nginx if running
print_status "Stopping nginx..."
sudo systemctl stop nginx || true

# Request SSL certificate
print_status "Requesting SSL certificate from Let's Encrypt..."
sudo certbot certonly \
    --standalone \
    --agree-tos \
    --no-eff-email \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Create SSL directory for Docker
print_status "Creating SSL directory for Docker..."
sudo mkdir -p /opt/flipdocs/docker/nginx/ssl

# Copy certificates to Docker directory
print_status "Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/flipdocs/docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/flipdocs/docker/nginx/ssl/key.pem

# Set permissions
sudo chown -R $USER:$USER /opt/flipdocs/docker/nginx/ssl
sudo chmod 600 /opt/flipdocs/docker/nginx/ssl/key.pem
sudo chmod 644 /opt/flipdocs/docker/nginx/ssl/cert.pem

# Setup automatic renewal
print_status "Setting up automatic certificate renewal..."
sudo tee /etc/cron.d/certbot-renew > /dev/null <<EOF
# Renew Let's Encrypt certificates
0 12 * * * root certbot renew --quiet --deploy-hook "/opt/flipdocs/scripts/ssl-deploy-hook.sh"
EOF

# Create deploy hook script
print_status "Creating SSL deploy hook..."
sudo tee /opt/flipdocs/scripts/ssl-deploy-hook.sh > /dev/null <<EOF
#!/bin/bash
# SSL Certificate Deploy Hook

# Copy renewed certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/flipdocs/docker/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/flipdocs/docker/nginx/ssl/key.pem

# Set permissions
chown $USER:$USER /opt/flipdocs/docker/nginx/ssl/cert.pem
chown $USER:$USER /opt/flipdocs/docker/nginx/ssl/key.pem
chmod 644 /opt/flipdocs/docker/nginx/ssl/cert.pem
chmod 600 /opt/flipdocs/docker/nginx/ssl/key.pem

# Restart nginx in Docker
cd /opt/flipdocs
docker-compose -f docker-compose.prod.yml restart nginx

echo "SSL certificates renewed and deployed successfully"
EOF

# Make deploy hook executable
sudo chmod +x /opt/flipdocs/scripts/ssl-deploy-hook.sh

# Test certificate renewal
print_status "Testing certificate renewal..."
sudo certbot renew --dry-run

print_status "✅ SSL certificates setup completed!"
print_status ""
print_status "Certificate details:"
print_status "Domain: $DOMAIN"
print_status "Email: $EMAIL"
print_status "Certificate location: /opt/flipdocs/docker/nginx/ssl/"
print_status ""
print_status "Automatic renewal is configured to run daily at 12:00 PM"
print_status "Certificates will be automatically renewed when they expire"