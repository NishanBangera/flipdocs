#!/bin/bash

# EC2 Setup Script for FlipDocs GHCR-Only Deployment
# This script prepares an EC2 instance for FlipDocs deployment without cloning the repository
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
    
    sudo $UPDATE_CMD
    
    case $PKG_MANAGER in
        "apt")
            sudo $INSTALL_CMD curl wget git htop nano vim unzip
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 specific packages - handle curl conflict
                print_status "Handling curl package conflict on Amazon Linux..."
                # Check if curl-minimal is installed and replace it with full curl
                if rpm -q curl-minimal > /dev/null 2>&1; then
                    print_status "Replacing curl-minimal with full curl package..."
                    sudo $INSTALL_CMD --allowerasing curl wget git htop nano vim unzip tar gzip
                else
                    sudo $INSTALL_CMD curl wget git htop nano vim unzip tar gzip
                fi
            else
                sudo $INSTALL_CMD curl wget git htop nano vim unzip
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
            sudo $UPDATE_CMD
            sudo $INSTALL_CMD ca-certificates curl gnupg lsb-release
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt update
            sudo $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 - use system Docker package
                print_status "Installing Docker for Amazon Linux 2023..."
                sudo $INSTALL_CMD docker
                
                # Install Docker Compose separately for Amazon Linux
                print_status "Installing Docker Compose..."
                sudo mkdir -p /usr/local/lib/docker/cli-plugins
                COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
                sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/lib/docker/cli-plugins/docker-compose
                sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
                
                # Create symlink for backward compatibility
                sudo ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
            else
                # CentOS/RHEL/Rocky - use Docker CE repository
                sudo $INSTALL_CMD yum-utils
                sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
                sudo $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            fi
            ;;
    esac
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
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
                sudo ufw --force reset
                sudo ufw default deny incoming
                sudo ufw default allow outgoing
                sudo ufw allow ssh
                sudo ufw allow 22/tcp
                sudo ufw allow 80/tcp
                sudo ufw allow 443/tcp
                sudo ufw --force enable
                print_status "UFW firewall configured"
            else
                print_warning "UFW not available, skipping firewall configuration"
            fi
            ;;
        "dnf"|"yum")
            # Amazon Linux/CentOS/RHEL - use firewalld
            if command -v firewall-cmd > /dev/null 2>&1; then
                sudo systemctl start firewalld
                sudo systemctl enable firewalld
                sudo firewall-cmd --permanent --add-service=ssh
                sudo firewall-cmd --permanent --add-service=http
                sudo firewall-cmd --permanent --add-service=https
                sudo firewall-cmd --reload
                print_status "Firewalld configured"
            else
                print_warning "Firewalld not available, skipping firewall configuration"
            fi
            ;;
    esac
}

# Setup application directory and download deployment files
setup_app_directory() {
    print_header "Setting Up Application Directory"
    
    APP_DIR="/opt/flipdocs"
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    cd "$APP_DIR"
    
    print_status "Application directory created: $APP_DIR"
    
    # Download deployment files
    print_status "Downloading deployment configuration from GitHub..."
    BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"
    
    # Download the files that actually exist in the repository
    if curl -fsSL -L "https://raw.githubusercontent.com/NishanBangera/flipdocs/main/docker-compose.prod.yml" -o docker-compose.prod.yml; then
        print_status "Downloaded docker-compose.prod.yml"
    else
        print_warning "Could not download docker-compose.prod.yml, creating basic version"
        create_basic_docker_compose
    fi

    if curl -fsSL -L "$BASE_URL/nginx.conf" -o nginx.conf; then
        print_status "Downloaded nginx.conf"
    else
        print_warning "Could not download nginx.conf, creating basic version"
        create_basic_nginx_conf
    fi

    if curl -fsSL -L "$BASE_URL/deploy.sh" -o deploy.sh; then
        print_status "Downloaded deploy.sh"
        chmod +x deploy.sh
    else
        print_warning "Could not download deploy.sh, creating basic version"
        create_basic_deploy_script
    fi
    
    # Download environment template
    if curl -fsSL -L "$BASE_URL/.env.production.template" -o .env.production.template; then
        print_status "Downloaded .env.production.template"
        if [ ! -f ".env.production" ]; then
            cp .env.production.template .env.production
            print_warning "Created .env.production from template"
            print_warning "Please update the environment variables before deploying!"
        fi
    else
        print_warning "Could not download .env.production.template, creating basic version"
        create_env_file
    fi
    
    # Create SSL directory
    mkdir -p ssl logs
    
    print_status "Deployment files downloaded successfully"
}

# Create helper scripts
create_helper_scripts() {
    print_header "Creating Helper Scripts"
    
    # Create update script
    cat > update-deployment.sh << 'EOF'
#!/bin/bash
# Update deployment configuration from repository

BASE_URL="https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deployment"

echo "Updating deployment files..."
curl -fsSL "https://raw.githubusercontent.com/NishanBangera/flipdocs/main/docker-compose.prod.yml" -o docker-compose.prod.yml
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

# Install certbot based on OS
if command -v apt > /dev/null 2>&1; then
    sudo apt update
    sudo apt install -y certbot
elif command -v dnf > /dev/null 2>&1; then
    sudo dnf install -y certbot
elif command -v yum > /dev/null 2>&1; then
    sudo yum install -y certbot
else
    echo "Cannot install certbot automatically. Please install manually."
    exit 1
fi

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
    
    print_status "Helper scripts created successfully"
}

# Create basic docker-compose.yml if download fails
create_basic_docker_compose() {
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: ghcr.io/nishanbangera/flipdocs-web:latest
    container_name: flipdocs-web
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    depends_on:
      - api
    networks:
      - flipdocs-network

  api:
    image: ghcr.io/nishanbangera/flipdocs-api:latest
    container_name: flipdocs-api
    restart: unless-stopped
    env_file:
      - .env.production
    networks:
      - flipdocs-network

  nginx:
    image: nginx:alpine
    container_name: flipdocs-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    depends_on:
      - web
      - api
    networks:
      - flipdocs-network

networks:
  flipdocs-network:
    driver: bridge
EOF
}

# Create basic nginx.conf if download fails
create_basic_nginx_conf() {
    cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream web {
        server web:3000;
    }

    upstream api {
        server api:3001;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 50M;

        location /api/ {
            proxy_pass http://api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location / {
            proxy_pass http://web/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # SSL configuration (commented out by default)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com;
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     
    #     client_max_body_size 50M;
    #     
    #     location /api/ {
    #         proxy_pass http://api/;
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #     }
    #     
    #     location / {
    #         proxy_pass http://web/;
    #         proxy_set_header Host $host;
    #         proxy_set_header X-Real-IP $remote_addr;
    #         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #         proxy_set_header X-Forwarded-Proto $scheme;
    #     }
    # }
}
EOF
}

# Create basic deploy script if download fails
create_basic_deploy_script() {
    cat > deploy.sh << 'EOF'
#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

case "${1:-deploy}" in
    "deploy"|"up")
        print_status "Deploying FlipDocs..."
        docker-compose pull
        docker-compose up -d
        print_status "Deployment complete!"
        ;;
    "stop"|"down")
        print_status "Stopping FlipDocs..."
        docker-compose down
        ;;
    "restart")
        print_status "Restarting FlipDocs..."
        docker-compose down
        docker-compose pull
        docker-compose up -d
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy/update application (default)"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - View logs (optionally specify service)"
        echo "  status   - Show service status"
        exit 1
        ;;
esac
EOF
    chmod +x deploy.sh
}

# Create basic environment file
create_env_file() {
    if [ ! -f ".env.production" ]; then
        cat > .env.production << 'EOF'
# FlipDocs Production Environment Configuration
NODE_ENV=production

# Redis Configuration (for container communication)
REDIS_URL=redis://redis:6379

# Clerk Authentication (Update with your Clerk keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Configuration (Update with your Supabase details)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration (Update yourdomain.com with your actual domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
EOF
        print_warning "Created .env.production template"
        print_warning "Please update the environment variables before deploying!"
    fi
}

# Configure Docker daemon
configure_docker() {
    print_header "Configuring Docker"
    
    # Configure Docker daemon with logging limits
    sudo mkdir -p /etc/docker
    sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    
    # Restart Docker to apply configuration
    sudo systemctl restart docker
    
    print_status "Docker daemon configured with log rotation"
}

# Create systemd service
create_systemd_service() {
    print_header "Creating Systemd Service"
    
    sudo tee /etc/systemd/system/flipdocs.service > /dev/null << EOF
[Unit]
Description=FlipDocs Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/flipdocs
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable flipdocs.service
    
    print_status "Systemd service created and enabled"
}

# Main setup function
main_setup() {
    print_header "Starting EC2 Setup for FlipDocs"
    
    detect_os
    install_tools
    install_docker
    configure_firewall
    setup_app_directory
    create_helper_scripts
    configure_docker
    create_systemd_service
    
    print_header "Setup Complete! 🎉"
    
    echo -e "${GREEN}System Information:${NC}"
    echo "  OS: $OS $VERSION_ID"
    echo "  Package Manager: $PKG_MANAGER"
    echo "  Docker: $(docker --version 2>/dev/null || echo 'Not available in current session')"
    echo "  Application Directory: /opt/flipdocs"
    
    print_header "Next Steps"
    echo -e "${BLUE}1.${NC} Edit environment file: ${YELLOW}cd /opt/flipdocs && nano .env.production${NC}"
    echo -e "${BLUE}2.${NC} Update required environment variables"
    echo -e "${BLUE}3.${NC} Deploy the application: ${YELLOW}./deploy.sh${NC}"
    echo -e "${BLUE}4.${NC} (Optional) Setup SSL: ${YELLOW}./setup-ssl.sh yourdomain.com${NC}"
    
    print_header "Useful Commands"
    echo -e "${GREEN}./deploy.sh${NC}          - Deploy/update application"
    echo -e "${GREEN}./deploy.sh logs${NC}     - View application logs"
    echo -e "${GREEN}./deploy.sh status${NC}   - Check service status"
    echo -e "${GREEN}./update-deployment.sh${NC} - Update deployment files"
    
    print_warning "Please log out and log back in for Docker group membership to take effect"
    print_warning "Make sure to update .env.production before deploying"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main_setup
        ;;
    "tools")
        detect_os
        install_tools
        ;;
    "docker")
        detect_os
        install_docker
        ;;
    "firewall")
        detect_os
        configure_firewall
        ;;
    *)
        echo "Usage: $0 {setup|tools|docker|firewall}"
        echo ""
        echo "Commands:"
        echo "  setup    - Full EC2 setup (default)"
        echo "  tools    - Install essential tools only"
        echo "  docker   - Install Docker only"
        echo "  firewall - Configure firewall only"
        exit 1
        ;;
esac