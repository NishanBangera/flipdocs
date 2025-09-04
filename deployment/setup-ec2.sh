#!/bin/bash

# EC2 Setup Script for FlipDocs GHCR-Only Deployment
# This script prepares an EC2 instance for FlipDocs deployment without cloning the repository

set -e

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

echo -e "${GREEN}🚀 Setting up EC2 for FlipDocs GHCR-Only Deployment${NC}"

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root user"
    SUDO=""
else
    print_status "Running with sudo privileges"
    SUDO="sudo"
fi

# Update system
print_header "Updating System"
$SUDO apt-get update
$SUDO apt-get upgrade -y

# Install essential packages
print_header "Installing Essential Packages"
$SUDO apt-get install -y \
    curl \
    wget \
    unzip \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    htop \
    nano \
    vim \
    fail2ban \
    ufw \
    jq

# Install Docker
print_header "Installing Docker"
if ! command -v docker > /dev/null 2>&1; then
    print_status "Installing Docker..."
    
    # Add Docker's official GPG key
    $SUDO install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    $SUDO apt-get update
    $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    $SUDO usermod -aG docker $USER
    
    print_status "Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose standalone
print_header "Installing Docker Compose"
if ! command -v docker-compose > /dev/null 2>&1; then
    print_status "Installing Docker Compose..."
    DOCKER_COMPOSE_VERSION="v2.21.0"
    $SUDO curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $SUDO chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Start and enable Docker
$SUDO systemctl start docker
$SUDO systemctl enable docker

# Configure firewall
print_header "Configuring Firewall"
$SUDO ufw --force reset
$SUDO ufw default deny incoming
$SUDO ufw default allow outgoing
$SUDO ufw allow ssh
$SUDO ufw allow 22/tcp
$SUDO ufw allow 80/tcp
$SUDO ufw allow 443/tcp
$SUDO ufw --force enable

# Create application directory
print_header "Setting Up Application Directory"
APP_DIR="/opt/flipdocs"
$SUDO mkdir -p "$APP_DIR"
$SUDO chown -R $USER:$USER "$APP_DIR"
cd "$APP_DIR"

# Download deployment files
print_header "Downloading Deployment Configuration"
BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"

print_status "Downloading docker-compose.yml..."
curl -fsSL "$BASE_URL/docker-compose.yml" -o docker-compose.yml

print_status "Downloading environment template..."
curl -fsSL "$BASE_URL/.env.production.template" -o .env.production.template

print_status "Downloading nginx configuration..."
curl -fsSL "$BASE_URL/nginx.conf" -o nginx.conf

print_status "Downloading deployment script..."
curl -fsSL "$BASE_URL/deploy.sh" -o deploy.sh
chmod +x deploy.sh

# Create SSL directory
mkdir -p ssl

# Create production environment file from template
if [ ! -f ".env.production" ]; then
    cp .env.production.template .env.production
    print_warning "Created .env.production from template"
    print_warning "Please update the environment variables before deploying!"
fi

# Create logs directory
mkdir -p logs

# Configure Docker logging
print_header "Configuring Docker"
$SUDO tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

$SUDO systemctl restart docker

# Create helpful scripts
print_header "Creating Helper Scripts"

# Create update script
cat > update-deployment.sh << 'EOF'
#!/bin/bash
# Update deployment configuration from repository

BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"

echo "Updating deployment files..."
curl -fsSL "$BASE_URL/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$BASE_URL/nginx.conf" -o nginx.conf
curl -fsSL "$BASE_URL/deploy.sh" -o deploy.sh
chmod +x deploy.sh

echo "Deployment files updated!"
echo "Review changes and run ./deploy.sh to deploy"
EOF
chmod +x update-deployment.sh

# Create SSL setup helper
cat > setup-ssl.sh << 'EOF'
#!/bin/bash
# Helper script to set up SSL with Let's Encrypt

if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain.com>"
    exit 1
fi

DOMAIN=$1

echo "Setting up SSL for domain: $DOMAIN"

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot

# Stop nginx temporarily
./deploy.sh stop

# Get certificate
sudo certbot certonly --standalone -d $DOMAIN

# Copy certificates to our SSL directory
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown -R $(whoami):$(whoami) ssl/

# Update nginx config to enable HTTPS
sed -i 's/#     listen 443 ssl http2;/    listen 443 ssl http2;/g' nginx.conf
sed -i 's/#     server_name yourdomain.com;/    server_name '$DOMAIN';/g' nginx.conf
sed -i 's/#     ssl_certificate/    ssl_certificate/g' nginx.conf
sed -i 's/#     ssl_/    ssl_/g' nginx.conf
sed -i 's/#     location/    location/g' nginx.conf
sed -i 's/#         /        /g' nginx.conf
sed -i 's/#     }/    }/g' nginx.conf
sed -i 's/# }/}/g' nginx.conf

# Restart services
./deploy.sh restart

echo "SSL setup complete for $DOMAIN"
echo "Your site should now be available at https://$DOMAIN"
EOF
chmod +x setup-ssl.sh

# Create systemd service
print_header "Creating Systemd Service"
$SUDO tee /etc/systemd/system/flipdocs.service > /dev/null << EOF
[Unit]
Description=FlipDocs Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

$SUDO systemctl daemon-reload
$SUDO systemctl enable flipdocs.service

# Show summary
print_header "Setup Complete!"
echo -e "${GREEN}Application directory:${NC} $APP_DIR"
echo -e "${GREEN}Docker version:${NC} $(docker --version)"
echo -e "${GREEN}Docker Compose version:${NC} $(docker-compose --version)"

print_header "Next Steps"
echo -e "${BLUE}1.${NC} Edit environment file: ${YELLOW}nano .env.production${NC}"
echo -e "${BLUE}2.${NC} Update required environment variables (see template)"
echo -e "${BLUE}3.${NC} Deploy the application: ${YELLOW}./deploy.sh${NC}"
echo -e "${BLUE}4.${NC} (Optional) Setup SSL: ${YELLOW}./setup-ssl.sh yourdomain.com${NC}"

print_header "Useful Commands"
echo -e "${GREEN}./deploy.sh${NC}          - Deploy/update application"
echo -e "${GREEN}./deploy.sh logs${NC}     - View application logs"
echo -e "${GREEN}./deploy.sh status${NC}   - Check service status"
echo -e "${GREEN}./deploy.sh stop${NC}     - Stop all services"
echo -e "${GREEN}./update-deployment.sh${NC} - Update deployment files"

print_header "Important Notes"
echo -e "${YELLOW}⚠️  Please log out and log back in for Docker group membership to take effect${NC}"
echo -e "${YELLOW}⚠️  Make sure to update .env.production before deploying${NC}"
echo -e "${YELLOW}⚠️  Ensure your GitHub Container Registry images are built and pushed${NC}"

echo -e "\n${GREEN}🎉 EC2 setup completed successfully!${NC}"