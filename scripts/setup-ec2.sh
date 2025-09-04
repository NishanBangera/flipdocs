#!/bin/bash

# EC2 Setup Script for FlipDocs Deployment
# This script prepares an EC2 instance for deploying FlipDocs with Docker
# Supports Amazon Linux 2023, Ubuntu, and other major distributions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${GREEN}🚀 Setting up EC2 instance for FlipDocs deployment${NC}"

# Detect OS and set package manager
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

# Check if running as root or with sudo
check_sudo() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root user"
        SUDO=""
    else
        print_status "Running with sudo privileges"
        SUDO="sudo"
    fi
}

# Install essential packages
install_essential_packages() {
    print_header "Installing Essential Packages"
    
    $SUDO $UPDATE_CMD
    
    case $PKG_MANAGER in
        "apt")
            $SUDO $INSTALL_CMD \
                curl \
                wget \
                git \
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
                ufw
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 specific packages
                $SUDO $INSTALL_CMD \
                    curl \
                    wget \
                    git \
                    unzip \
                    htop \
                    nano \
                    vim \
                    tar \
                    gzip \
                    procps-ng
            else
                $SUDO $INSTALL_CMD \
                    curl \
                    wget \
                    git \
                    unzip \
                    htop \
                    nano \
                    vim
            fi
            ;;
    esac
    
    print_status "Essential packages installed successfully"
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
            $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
            
            echo \
              "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
              "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
              $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            $SUDO apt update
            $SUDO $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
        "dnf"|"yum")
            if [[ $OS == *"Amazon Linux"* ]]; then
                # Amazon Linux 2023 - use system Docker package
                print_status "Installing Docker for Amazon Linux 2023..."
                $SUDO $INSTALL_CMD docker
                
                # Install Docker Compose separately
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
    
    print_status "Docker installed successfully"
    print_warning "You may need to log out and back in for Docker group membership to take effect"
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
                print_status "UFW firewall configured successfully"
            else
                print_warning "UFW not available, skipping firewall configuration"
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
                print_status "Firewalld configured successfully"
            else
                print_warning "Firewalld not available, installing and configuring..."
                $SUDO $INSTALL_CMD firewalld
                $SUDO systemctl start firewalld
                $SUDO systemctl enable firewalld
                $SUDO firewall-cmd --permanent --add-service=ssh
                $SUDO firewall-cmd --permanent --add-service=http
                $SUDO firewall-cmd --permanent --add-service=https
                $SUDO firewall-cmd --reload
                print_status "Firewalld installed and configured successfully"
            fi
            ;;
    esac
}

# Create application directory
create_app_directory() {
    print_header "Setting up Application Directory"
    APP_DIR="/opt/flipdocs"
    if [ ! -d "$APP_DIR" ]; then
        $SUDO mkdir -p "$APP_DIR"
        $SUDO chown -R $USER:$USER "$APP_DIR"
        print_status "Application directory created at $APP_DIR"
    else
        print_status "Application directory already exists at $APP_DIR"
    fi
}

# Clone repository (optional)
setup_repository() {
    print_header "Repository Setup"
    read -p "Do you want to clone the FlipDocs repository? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter the repository URL: " REPO_URL
        if [ -n "$REPO_URL" ]; then
            cd "$APP_DIR"
            if [ ! -d ".git" ]; then
                git clone "$REPO_URL" .
                print_status "Repository cloned successfully"
            else
                print_status "Repository already exists, pulling latest changes..."
                git pull origin main
            fi
        fi
    fi
}

# Create environment file template
create_env_template() {
    print_header "Environment Configuration"
    ENV_FILE="$APP_DIR/.env.production"
    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" << 'EOF'
# FlipDocs Production Environment Configuration
NODE_ENV=production

# API Configuration
PORT=3001
API_URL=http://localhost:3001

# Database Configuration (Update with your actual database details)
DATABASE_URL=postgresql://username:password@localhost:5432/flipdocs

# Redis Configuration
REDIS_URL=redis://localhost:6379

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

# Storage Configuration
STORAGE_PROVIDER=supabase
SUPABASE_STORAGE_BUCKET=flipbooks

# Application Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
EOF
        print_warning "Environment file created at $ENV_FILE"
        print_warning "Please update the environment variables with your actual configuration"
    else
        print_status "Environment file already exists"
    fi
}

# Configure Docker daemon
configure_docker_daemon() {
    print_header "Configuring Docker Logging"
    $SUDO tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF

    # Restart Docker to apply logging configuration
    $SUDO systemctl restart docker
    print_status "Docker daemon configured with log rotation"
}

# Create systemd service
create_systemd_service() {
    print_header "Systemd Service Setup"
    read -p "Do you want to create a systemd service for auto-start? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $SUDO tee /etc/systemd/system/flipdocs.service > /dev/null << EOF
[Unit]
Description=FlipDocs Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

        $SUDO systemctl daemon-reload
        $SUDO systemctl enable flipdocs.service
        print_status "Systemd service created and enabled"
    fi
}

# Display system information
show_system_info() {
    print_header "System Information"
    echo -e "${GREEN}OS:${NC} $OS $VERSION_ID"
    echo -e "${GREEN}Package Manager:${NC} $PKG_MANAGER"
    echo -e "${GREEN}Docker version:${NC} $(docker --version 2>/dev/null || echo 'Not available in current session')"
    if command -v docker-compose > /dev/null 2>&1; then
        echo -e "${GREEN}Docker Compose version:${NC} $(docker-compose --version)"
    fi
    echo -e "${GREEN}Available memory:${NC} $(free -h | grep ^Mem | awk '{print $2}')"
    echo -e "${GREEN}Available disk space:${NC} $(df -h / | awk 'NR==2{print $4}')"
    echo -e "${GREEN}Application directory:${NC} $APP_DIR"
}

# Main setup function
main() {
    detect_os
    check_sudo
    install_essential_packages
    install_docker
    configure_firewall
    create_app_directory
    setup_repository
    create_env_template
    configure_docker_daemon
    create_systemd_service
    show_system_info
    
    print_header "Next Steps"
    echo -e "${BLUE}1.${NC} Update the environment file: $ENV_FILE"
    echo -e "${BLUE}2.${NC} Configure your domain DNS to point to this server"
    echo -e "${BLUE}3.${NC} Set up SSL certificates (use Let's Encrypt with Certbot)"
    echo -e "${BLUE}4.${NC} Run the deployment script"
    
    print_header "Important Security Notes"
    echo -e "${YELLOW}⚠️  Remember to:${NC}"
    echo "   - Update environment variables with actual values"
    echo "   - Configure SSL/HTTPS for production"
    echo "   - Set up proper backup procedures"
    echo "   - Monitor system resources"
    echo "   - Keep system packages updated"
    
    echo -e "\n${GREEN}🎉 EC2 setup completed successfully!${NC}"
    echo -e "${GREEN}You can now deploy FlipDocs to this server.${NC}"
    
    # Logout required message
    echo -e "\n${YELLOW}⚠️  Please log out and log back in for Docker group membership to take effect.${NC}"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "docker")
        detect_os
        check_sudo
        install_docker
        ;;
    "tools")
        detect_os
        check_sudo
        install_essential_packages
        ;;
    "firewall")
        detect_os
        check_sudo
        configure_firewall
        ;;
    *)
        echo "Usage: $0 {setup|docker|tools|firewall}"
        echo ""
        echo "Commands:"
        echo "  setup    - Full EC2 setup (default)"
        echo "  docker   - Install Docker only"
        echo "  tools    - Install essential tools only"
        echo "  firewall - Configure firewall only"
        exit 1
        ;;
esac