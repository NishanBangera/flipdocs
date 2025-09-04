#!/bin/bash

# EC2 Setup Script for FlipDocs GHCR-Only Deployment
# This script prepares an EC2 instance for FlipDocs deployment using GitHub Container Registry
# without cloning the repository - pulls pre-built images only
# Supports Amazon Linux 2023, Ubuntu, and other major distributions

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

# Detect OS and package manager
detect_os() {
    print_status "Detecting operating system..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VERSION_ID=$VERSION_ID
        print_status "Detected: $OS $VERSION_ID"
        
        case $OS in
            "Ubuntu"*|"Debian"*)
                PKG_MANAGER="apt"
                UPDATE_CMD="apt update"
                INSTALL_CMD="apt install -y"
                ;;
            "Amazon Linux"*)
                if [[ $VERSION_ID == "2023" ]]; then
                    PKG_MANAGER="dnf"
                    UPDATE_CMD="dnf update -y"
                    INSTALL_CMD="dnf install -y"
                else
                    PKG_MANAGER="yum"
                    UPDATE_CMD="yum update -y"
                    INSTALL_CMD="yum install -y"
                fi
                ;;
            "CentOS"*|"Red Hat"*|"Rocky"*|"AlmaLinux"*)
                if command -v dnf > /dev/null 2>&1; then
                    PKG_MANAGER="dnf"
                    UPDATE_CMD="dnf update -y"
                    INSTALL_CMD="dnf install -y"
                else
                    PKG_MANAGER="yum"
                    UPDATE_CMD="yum update -y"
                    INSTALL_CMD="yum install -y"
                fi
                ;;
            *)
                print_warning "Unknown OS: $OS. Attempting auto-detection..."
                if command -v dnf > /dev/null 2>&1; then
                    PKG_MANAGER="dnf"
                    UPDATE_CMD="dnf update -y"
                    INSTALL_CMD="dnf install -y"
                elif command -v yum > /dev/null 2>&1; then
                    PKG_MANAGER="yum"
                    UPDATE_CMD="yum update -y"
                    INSTALL_CMD="yum install -y"
                else
                    PKG_MANAGER="apt"
                    UPDATE_CMD="apt update"
                    INSTALL_CMD="apt install -y"
                fi
                ;;
        esac
    else
        print_error "Cannot detect OS. Exiting."
        exit 1
    fi
    
    print_status "Using package manager: $PKG_MANAGER"
}

# Install essential tools
install_tools() {
    print_header "Installing Essential Tools"
    
    $SUDO $UPDATE_CMD
    
    case $PKG_MANAGER in
        "apt")
            $SUDO $INSTALL_CMD \
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
                jq
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 specific packages
                $SUDO $INSTALL_CMD \
                    curl \
                    wget \
                    unzip \
                    htop \
                    nano \
                    vim \
                    tar \
                    gzip \
                    jq
            else
                $SUDO $INSTALL_CMD \
                    curl \
                    wget \
                    unzip \
                    htop \
                    nano \
                    vim \
                    jq
            fi
            ;;
    esac
    
    print_status "Essential tools installed successfully"
}

# Install Docker
install_docker() {
    print_header "Installing Docker"
    
    if command -v docker > /dev/null 2>&1; then
        print_status "Docker already installed: $(docker --version)"
        return
    fi
    
    case $PKG_MANAGER in
        "apt")
            # Ubuntu/Debian Docker installation
            $SUDO $UPDATE_CMD
            $SUDO $INSTALL_CMD ca-certificates curl gnupg lsb-release
            $SUDO mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
            $SUDO apt update
            $SUDO $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 - use system Docker package
                print_status "Installing Docker for Amazon Linux 2023..."
                $SUDO $INSTALL_CMD docker
                
                # Install Docker Compose separately for Amazon Linux
                print_status "Installing Docker Compose..."
                $SUDO mkdir -p /usr/local/lib/docker/cli-plugins
                COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
                $SUDO curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
                $SUDO chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
                
                # Create symlink for backward compatibility
                $SUDO ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
            else
                # CentOS/RHEL/Rocky - use Docker CE repository
                $SUDO $INSTALL_CMD yum-utils
                $SUDO yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                $SUDO $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            fi
            ;;
    esac
    
    # Start and enable Docker
    $SUDO systemctl start docker
    $SUDO systemctl enable docker
    
    # Add current user to docker group
    $SUDO usermod -aG docker $USER
    
    print_status "Docker installed successfully: $(docker --version)"
    print_warning "You may need to log out and back in for docker group permissions to take effect"
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"
    
    case $PKG_MANAGER in
        "apt")
            # Ubuntu/Debian - use ufw
            if command -v ufw > /dev/null 2>&1; then
                $SUDO ufw --force reset
                $SUDO ufw default deny incoming
                $SUDO ufw default allow outgoing
                $SUDO ufw allow ssh
                $SUDO ufw allow 22/tcp
                $SUDO ufw allow 80/tcp
                $SUDO ufw allow 443/tcp
                $SUDO ufw --force enable
                print_status "UFW firewall configured"
            else
                print_warning "UFW not available, installing..."
                $SUDO $INSTALL_CMD ufw
                $SUDO ufw --force reset
                $SUDO ufw default deny incoming
                $SUDO ufw default allow outgoing
                $SUDO ufw allow ssh
                $SUDO ufw allow 22/tcp
                $SUDO ufw allow 80/tcp
                $SUDO ufw allow 443/tcp
                $SUDO ufw --force enable
                print_status "UFW firewall installed and configured"
            fi
            ;;
        "dnf"|"yum")
            # Amazon Linux/CentOS/RHEL - use firewalld
            if command -v firewall-cmd > /dev/null 2>&1; then
                $SUDO systemctl start firewalld
                $SUDO systemctl enable firewalld
                $SUDO firewall-cmd --permanent --add-service=ssh
                $SUDO firewall-cmd --permanent --add-service=http
                $SUDO firewall-cmd --permanent --add-service=https
                $SUDO firewall-cmd --reload
                print_status "Firewalld configured"
            else
                print_warning "Firewalld not available, installing..."
                $SUDO $INSTALL_CMD firewalld
                $SUDO systemctl start firewalld
                $SUDO systemctl enable firewalld
                $SUDO firewall-cmd --permanent --add-service=ssh
                $SUDO firewall-cmd --permanent --add-service=http
                $SUDO firewall-cmd --permanent --add-service=https
                $SUDO firewall-cmd --reload
                print_status "Firewalld installed and configured"
            fi
            ;;
    esac
}

# Setup application directory and download GHCR deployment files
setup_ghcr_deployment() {
    print_header "Setting Up GHCR Deployment Directory"
    
    APP_DIR="/opt/flipdocs"
    $SUDO mkdir -p "$APP_DIR"
    $SUDO chown -R $USER:$USER "$APP_DIR"
    cd "$APP_DIR"
    
    print_status "Application directory created: $APP_DIR"
    
    # Download GHCR-specific deployment files
    print_status "Downloading GHCR deployment configuration from GitHub..."
    BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"
    
    # Download main deployment files
    curl -fsSL "$BASE_URL/docker-compose.yml" -o docker-compose.yml
    curl -fsSL "$BASE_URL/.env.production.template" -o .env.production.template
    curl -fsSL "$BASE_URL/nginx.conf" -o nginx.conf
    curl -fsSL "$BASE_URL/deploy.sh" -o deploy.sh
    chmod +x deploy.sh
    
    # Create additional directories
    mkdir -p ssl logs
    
    # Create production environment file from template
    if [ ! -f ".env.production" ]; then
        cp .env.production.template .env.production
        print_warning "Created .env.production from template"
        print_warning "Please update the environment variables before deploying!"
    fi
    
    print_status "GHCR deployment files downloaded successfully"
}

# Create GHCR-specific helper scripts
create_ghcr_scripts() {
    print_header "Creating GHCR Helper Scripts"
    
    # Create update script for GHCR deployment
    cat > update-ghcr-deployment.sh << 'EOF'
#!/bin/bash
# Update GHCR deployment configuration from repository

BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"

echo "🔄 Updating GHCR deployment files..."
curl -fsSL "$BASE_URL/docker-compose.yml" -o docker-compose.yml
curl -fsSL "$BASE_URL/nginx.conf" -o nginx.conf
curl -fsSL "$BASE_URL/deploy.sh" -o deploy.sh
chmod +x deploy.sh

echo "✅ GHCR deployment files updated!"
echo "📋 Review changes and run ./deploy.sh to deploy"
EOF
    chmod +x update-ghcr-deployment.sh
    
    # Create SSL setup helper that works with all OS types
    cat > setup-ssl.sh << 'EOF'
#!/bin/bash
# Helper script to set up SSL with Let's Encrypt for GHCR deployment

if [ -z "$1" ]; then
    echo "Usage: $0 <your-domain.com>"
    exit 1
fi

DOMAIN=$1

echo "🔐 Setting up SSL for domain: $DOMAIN"

# Install certbot based on OS
if command -v apt > /dev/null 2>&1; then
    sudo apt update
    sudo apt install -y certbot
elif command -v dnf > /dev/null 2>&1; then
    sudo dnf install -y certbot
elif command -v yum > /dev/null 2>&1; then
    sudo yum install -y certbot
else
    echo "❌ Cannot install certbot automatically. Please install manually."
    exit 1
fi

# Stop nginx temporarily
echo "🛑 Stopping services to get SSL certificate..."
./deploy.sh stop

# Get certificate
echo "📜 Requesting SSL certificate for $DOMAIN..."
sudo certbot certonly --standalone -d $DOMAIN

# Copy certificates to our SSL directory
echo "📋 Copying certificates to application directory..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/key.pem
sudo chown -R $(whoami):$(whoami) ssl/

# Update nginx config to enable HTTPS
echo "⚙️ Updating nginx configuration for HTTPS..."
sed -i 's/#     listen 443 ssl http2;/    listen 443 ssl http2;/g' nginx.conf
sed -i 's/#     server_name yourdomain.com;/    server_name '$DOMAIN';/g' nginx.conf
sed -i 's/#     ssl_certificate/    ssl_certificate/g' nginx.conf
sed -i 's/#     ssl_/    ssl_/g' nginx.conf
sed -i 's/#     location/    location/g' nginx.conf
sed -i 's/#         /        /g' nginx.conf
sed -i 's/#     }/    }/g' nginx.conf
sed -i 's/# }/}/g' nginx.conf

# Restart services
echo "🚀 Restarting services with SSL enabled..."
./deploy.sh restart

echo "✅ SSL setup complete for $DOMAIN"
echo "🌐 Your site should now be available at https://$DOMAIN"
EOF
    chmod +x setup-ssl.sh
    
    # Create GHCR image management script
    cat > manage-images.sh << 'EOF'
#!/bin/bash
# Helper script to manage GHCR images

case "${1:-status}" in
    "pull")
        echo "🔄 Pulling latest images from GHCR..."
        docker-compose pull
        echo "✅ Images pulled successfully"
        ;;
    "update")
        echo "🔄 Updating to latest images..."
        ./deploy.sh stop
        docker-compose pull
        ./deploy.sh start
        echo "✅ Images updated and services restarted"
        ;;
    "cleanup")
        echo "🧹 Cleaning up unused Docker images..."
        docker image prune -f
        echo "✅ Cleanup complete"
        ;;
    "status")
        echo "📊 GHCR Image Status:"
        echo ""
        docker images | grep ghcr.io
        echo ""
        echo "💾 Docker disk usage:"
        docker system df
        ;;
    *)
        echo "Usage: $0 {pull|update|cleanup|status}"
        echo ""
        echo "Commands:"
        echo "  pull    - Pull latest images from GHCR"
        echo "  update  - Update and restart with latest images"
        echo "  cleanup - Remove unused Docker images"
        echo "  status  - Show image status and disk usage"
        exit 1
        ;;
esac
EOF
    chmod +x manage-images.sh
    
    print_status "GHCR helper scripts created successfully"
}

# Configure Docker daemon for GHCR
configure_docker_for_ghcr() {
    print_header "Configuring Docker for GHCR"
    
    # Configure Docker daemon with logging limits and GHCR optimizations
    $SUDO mkdir -p /etc/docker
    $SUDO tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "registry-mirrors": [],
    "insecure-registries": [],
    "storage-driver": "overlay2"
}
EOF
    
    # Restart Docker to apply configuration
    $SUDO systemctl restart docker
    
    # Login to GHCR (interactive)
    print_warning "To pull private images from GHCR, you may need to login:"
    print_status "Run: docker login ghcr.io"
    print_status "Use your GitHub username and a Personal Access Token with package:read permissions"
    
    print_status "Docker configured for GHCR usage"
}

# Create systemd service for GHCR deployment
create_ghcr_systemd_service() {
    print_header "Creating Systemd Service for GHCR Deployment"
    
    $SUDO tee /etc/systemd/system/flipdocs-ghcr.service > /dev/null << EOF
[Unit]
Description=FlipDocs Application (GHCR Deployment)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/flipdocs
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose pull && /usr/local/bin/docker-compose up -d
TimeoutStartSec=300
User=$USER

[Install]
WantedBy=multi-user.target
EOF
    
    $SUDO systemctl daemon-reload
    $SUDO systemctl enable flipdocs-ghcr.service
    
    print_status "Systemd service created and enabled for GHCR deployment"
}

# Main setup function
main_ghcr_setup() {
    print_header "Starting EC2 Setup for FlipDocs GHCR Deployment"
    
    detect_os
    install_tools
    install_docker
    configure_firewall
    setup_ghcr_deployment
    create_ghcr_scripts
    configure_docker_for_ghcr
    create_ghcr_systemd_service
    
    print_header "GHCR Setup Complete! 🎉"
    
    echo -e "${GREEN}System Information:${NC}"
    echo "  OS: $OS $VERSION_ID"
    echo "  Package Manager: $PKG_MANAGER"
    echo "  Docker: $(docker --version 2>/dev/null || echo 'Not available in current session')"
    echo "  Application Directory: /opt/flipdocs"
    echo "  Deployment Type: GHCR (GitHub Container Registry)"
    
    print_header "Next Steps"
    echo -e "${BLUE}1.${NC} Edit environment file: ${YELLOW}cd /opt/flipdocs && nano .env.production${NC}"
    echo -e "${BLUE}2.${NC} Update required environment variables (Database, Clerk, Supabase, etc.)"
    echo -e "${BLUE}3.${NC} (Optional) Login to GHCR: ${YELLOW}docker login ghcr.io${NC}"
    echo -e "${BLUE}4.${NC} Deploy the application: ${YELLOW}./deploy.sh${NC}"
    echo -e "${BLUE}5.${NC} (Optional) Setup SSL: ${YELLOW}./setup-ssl.sh yourdomain.com${NC}"
    
    print_header "GHCR Management Commands"
    echo -e "${GREEN}./deploy.sh${NC}              - Deploy/update application"
    echo -e "${GREEN}./deploy.sh logs${NC}         - View application logs"
    echo -e "${GREEN}./deploy.sh status${NC}       - Check service status"
    echo -e "${GREEN}./manage-images.sh pull${NC}   - Pull latest GHCR images"
    echo -e "${GREEN}./manage-images.sh update${NC} - Update to latest images"
    echo -e "${GREEN}./update-ghcr-deployment.sh${NC} - Update deployment files"
    
    print_header "Important Notes"
    echo -e "${YELLOW}⚠️  GHCR Deployment Notes:${NC}"
    echo "   • No repository cloning - uses pre-built images only"
    echo "   • Images are pulled from GitHub Container Registry"
    echo "   • Ensure GitHub Actions builds and pushes images successfully"
    echo "   • For private repos, login to GHCR with GitHub token"
    
    print_warning "Please log out and log back in for Docker group membership to take effect"
    print_warning "Make sure to update .env.production before deploying"
    print_warning "Verify GitHub Actions has built and pushed images to GHCR"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main_ghcr_setup
        ;;
    "tools")
        detect_os
        install_tools
        ;;
    "docker")
        detect_os
        install_docker
        configure_docker_for_ghcr
        ;;
    "firewall")
        detect_os
        configure_firewall
        ;;
    "ghcr")
        detect_os
        setup_ghcr_deployment
        create_ghcr_scripts
        ;;
    *)
        echo "Usage: $0 {setup|tools|docker|firewall|ghcr}"
        echo ""
        echo "Commands:"
        echo "  setup    - Full GHCR EC2 setup (default)"
        echo "  tools    - Install essential tools only"
        echo "  docker   - Install and configure Docker for GHCR"
        echo "  firewall - Configure firewall only"
        echo "  ghcr     - Setup GHCR deployment files only"
        exit 1
        ;;
esac
