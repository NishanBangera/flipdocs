#!/bin/bash

# FlipDocs EC2 SSL Deployment Auto-Setup Script
# This script creates all necessary files and sets up SSL deployment on EC2 instance

set -e

echo "🚀 FlipDocs EC2 SSL Deployment Setup"
echo "===================================="
echo ""

# Configuration
DOMAIN="flipbook.ironasylum.in"
GITHUB_USERNAME="nishanbangera"
DEPLOYMENT_DIR="flipdocs-ssl"

# Get user inputs
read -p "Enter your GitHub username (default: $GITHUB_USERNAME): " input_username
GITHUB_USERNAME=${input_username:-$GITHUB_USERNAME}

read -p "Enter your domain (default: $DOMAIN): " input_domain
DOMAIN=${input_domain:-$DOMAIN}

read -p "Enter your email for SSL certificates (or press Enter for default): " input_email
SSL_EMAIL=${input_email:-"admin@ironasylum.in"}

read -p "Enter your Clerk publishable key (pk_live_...): " CLERK_PUBLISHABLE_KEY
read -p "Enter your Clerk secret key (sk_live_...): " CLERK_SECRET_KEY

read -p "Enter your Supabase URL: " SUPABASE_URL
read -p "Enter your Supabase anon key: " SUPABASE_ANON_KEY
read -p "Enter your Supabase service key: " SUPABASE_SERVICE_KEY

echo ""
echo "📁 Creating deployment directory: $DEPLOYMENT_DIR"
mkdir -p $DEPLOYMENT_DIR
cd $DEPLOYMENT_DIR

echo "📄 Creating docker-compose.ssl.yml..."
cat > docker-compose.ssl.yml << 'EOF'
name: flipdocs-ssl
services:
  api:
    image: ${GHCR_REGISTRY}/${GITHUB_USERNAME}/flipdocs-api:${IMAGE_TAG:-latest}
    container_name: flipdocs-api
    volumes:
      - ./data/storage:/app/storage
    environment:
      - TZ=UTC
      - PORT=3001
      - NODE_ENV=production
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - FRONTEND_URL=https://flipbook.ironasylum.in
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  web:
    image: ${GHCR_REGISTRY}/${GITHUB_USERNAME}/flipdocs-web:${IMAGE_TAG:-latest}
    container_name: flipdocs-web
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://flipbook.ironasylum.in/api
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: flipdocs-proxy
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./certbot/www:/var/www/certbot:ro
      - ./certbot/conf:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - web
      - api
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  certbot:
    image: certbot/certbot:latest
    container_name: flipdocs-certbot
    volumes:
      - ./certbot/www:/var/www/certbot:rw
      - ./certbot/conf:/etc/letsencrypt:rw
EOF

echo "🔧 Creating environment file (.env)..."
cat > .env << EOF
# GHCR Configuration
GHCR_REGISTRY=ghcr.io
GITHUB_USERNAME=$GITHUB_USERNAME
IMAGE_TAG=latest

# Domain Configuration
DOMAIN=$DOMAIN
SSL_EMAIL=$SSL_EMAIL

# Production Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# Application URLs
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
FRONTEND_URL=https://$DOMAIN
EOF

echo "📝 Creating initial nginx configuration..."
cat > nginx.conf << EOF
server {
    listen 80;
    listen [::]:80;

    server_name $DOMAIN;
    server_tokens off;

    # Allow Certbot to access ACME challenge files
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$DOMAIN\$request_uri;
    }
}
EOF

echo "🔐 Creating SSL nginx configuration..."
cat > nginx.ssl.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;

    server_name flipbook.ironasylum.in;
    server_tokens off;

    # Allow Certbot to access ACME challenge files
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://flipbook.ironasylum.in$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name flipbook.ironasylum.in;
    server_tokens off;

    # SSL certificate configuration
    ssl_certificate /etc/nginx/ssl/live/flipbook.ironasylum.in/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/flipbook.ironasylum.in/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; object-src 'none'; media-src 'self' https:; frame-src 'self' https:;" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=50r/s;
    limit_req_zone $binary_remote_addr zone=web:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
    limit_conn conn_limit_per_ip 20;

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=100 nodelay;
        
        proxy_pass http://api:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff" always;
        
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js static files
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web application with rate limiting
    location / {
        limit_req zone=web burst=200 nodelay;
        
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Robots.txt
    location = /robots.txt {
        access_log off;
        return 200 "User-agent: *\nDisallow: /api/auth/\nDisallow: /dashboard/\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo "🔐 Creating SSL setup script..."
cat > setup-ssl.sh << 'EOF'
#!/bin/bash

set -e

DOMAIN="flipbook.ironasylum.in"
DRY_RUN=${1:-"--dry-run"}

echo "🔒 Setting up SSL certificates for $DOMAIN"
echo "Mode: $DRY_RUN"

# Create directories
mkdir -p certbot/www certbot/conf data/storage

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f docker-compose.ssl.yml pull

# Start nginx for ACME challenge
echo "🚀 Starting nginx..."
docker-compose -f docker-compose.ssl.yml up -d nginx

sleep 10

# Generate certificates
echo "🔐 Generating SSL certificate..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🧪 Running dry-run..."
    docker-compose -f docker-compose.ssl.yml run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --dry-run --email ${SSL_EMAIL} --agree-tos --no-eff-email \
        -d $DOMAIN
else
    echo "🎯 Generating real certificate..."
    docker-compose -f docker-compose.ssl.yml run --rm certbot \
        certonly --webroot --webroot-path /var/www/certbot/ \
        --email ${SSL_EMAIL} --agree-tos --no-eff-email \
        -d $DOMAIN
fi

if [ $? -eq 0 ]; then
    if [ "$DRY_RUN" = "--dry-run" ]; then
        echo "✅ Dry run successful! Run: ./setup-ssl.sh --force-renewal"
    else
        echo "✅ SSL certificates generated!"
        echo "📝 Next: Run './deploy.sh' to start with SSL"
    fi
else
    echo "❌ Certificate generation failed!"
    exit 1
fi
EOF

echo "🚀 Creating deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash

set -e

echo "🚀 Deploying FlipDocs with SSL..."

# Switch to SSL nginx configuration
echo "📝 Switching to SSL nginx configuration..."
cp nginx.ssl.conf nginx.conf

# Start all services
echo "🌐 Starting all services..."
docker-compose -f docker-compose.ssl.yml up -d

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://flipbook.ironasylum.in"
echo ""
echo "📊 Check status with:"
echo "   docker-compose -f docker-compose.ssl.yml ps"
echo "   docker-compose -f docker-compose.ssl.yml logs -f"
EOF

echo "🔄 Creating renewal script..."
cat > renew-ssl.sh << 'EOF'
#!/bin/bash

echo "🔄 Renewing SSL certificates..."

docker-compose -f docker-compose.ssl.yml run --rm certbot renew

if [ $? -eq 0 ]; then
    echo "✅ Certificate renewal successful!"
    docker-compose -f docker-compose.ssl.yml exec nginx nginx -s reload
    echo "🔄 Nginx reloaded"
else
    echo "❌ Certificate renewal failed!"
    exit 1
fi
EOF

echo "📋 Creating quick reference..."
cat > README.md << EOF
# FlipDocs SSL Deployment - Quick Reference

## 🚀 Quick Setup

1. **Setup SSL (dry run first)**:
   \`\`\`bash
   chmod +x *.sh
   ./setup-ssl.sh --dry-run
   \`\`\`

2. **Generate real certificates**:
   \`\`\`bash
   ./setup-ssl.sh --force-renewal
   \`\`\`

3. **Deploy with SSL**:
   \`\`\`bash
   ./deploy.sh
   \`\`\`

## 📊 Monitoring

- **Check status**: \`docker-compose -f docker-compose.ssl.yml ps\`
- **View logs**: \`docker-compose -f docker-compose.ssl.yml logs -f\`
- **Test site**: \`curl -I https://$DOMAIN\`

## 🔄 Updates

- **Update app**: \`docker-compose -f docker-compose.ssl.yml pull && docker-compose -f docker-compose.ssl.yml up -d\`
- **Renew SSL**: \`./renew-ssl.sh\`

## 🔧 Troubleshooting

- **Restart nginx**: \`docker-compose -f docker-compose.ssl.yml restart nginx\`
- **Check nginx config**: \`docker-compose -f docker-compose.ssl.yml exec nginx nginx -t\`
- **View certificate**: \`docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates\`

Your site: https://$DOMAIN
EOF

# Make scripts executable
chmod +x *.sh

# Create directories
mkdir -p certbot/www certbot/conf data/storage

echo ""
echo "✅ Setup complete! Created deployment in: $DEPLOYMENT_DIR"
echo ""
echo "📝 Next steps:"
echo "   1. cd $DEPLOYMENT_DIR"
echo "   2. ./setup-ssl.sh --dry-run    # Test SSL setup"
echo "   3. ./setup-ssl.sh --force-renewal    # Generate real certificates"
echo "   4. ./deploy.sh    # Deploy with SSL"
echo ""
echo "📊 Monitor with:"
echo "   docker-compose -f docker-compose.ssl.yml logs -f"
echo ""
echo "🌐 Your site will be available at: https://$DOMAIN"