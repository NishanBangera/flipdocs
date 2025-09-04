#!/bin/bash#!/bin/bash



# EC2 Setup Script for FlipDocs Deployment# Setup script for EC2 instance deployment

# This script prepares an EC2 instance for deploying FlipDocs with Docker# This script prepares the EC2 instance for running FlipDocs



set -eset -e



# Colors for output# Colors for output

RED='\033[0;31m'RED='\033[0;31m'

GREEN='\033[0;32m'GREEN='\033[0;32m'

YELLOW='\033[1;33m'YELLOW='\033[1;33m'

BLUE='\033[0;34m'NC='\033[0m' # No Color

NC='\033[0m' # No Color

print_status() {

print_status() {    echo -e "${GREEN}[INFO]${NC} $1"

    echo -e "${GREEN}[INFO]${NC} $1"}

}

print_warning() {

print_warning() {    echo -e "${YELLOW}[WARNING]${NC} $1"

    echo -e "${YELLOW}[WARNING]${NC} $1"}

}

print_error() {

print_error() {    echo -e "${RED}[ERROR]${NC} $1"

    echo -e "${RED}[ERROR]${NC} $1"}

}

# Function to check if running on supported Linux distro

print_header() {check_os() {

    echo -e "${BLUE}=== $1 ===${NC}"    print_status "Checking operating system..."

}    

    if [ -f /etc/os-release ]; then

echo -e "${GREEN}🚀 Setting up EC2 instance for FlipDocs deployment${NC}"        . /etc/os-release

        OS=$NAME

# Check if running as root or with sudo        VERSION=$VERSION_ID

if [ "$EUID" -eq 0 ]; then        print_status "Detected OS: $OS $VERSION"

    print_warning "Running as root user"        

    SUDO=""        case $OS in

else            "Ubuntu"*|"Debian"*)

    print_status "Running with sudo privileges"                PKG_MANAGER="apt-get"

    SUDO="sudo"                UPDATE_CMD="apt-get update"

fi                INSTALL_CMD="apt-get install -y"

                ;;

# Update system packages            "Amazon Linux"*|"CentOS"*|"Red Hat"*)

print_header "Updating System Packages"                PKG_MANAGER="yum"

$SUDO apt-get update                UPDATE_CMD="yum update -y"

$SUDO apt-get upgrade -y                INSTALL_CMD="yum install -y"

                ;;

# Install essential packages            *)

print_header "Installing Essential Packages"                print_warning "Unsupported OS: $OS. Proceeding with apt-get..."

$SUDO apt-get install -y \                PKG_MANAGER="apt-get"

    curl \                UPDATE_CMD="apt-get update"

    wget \                INSTALL_CMD="apt-get install -y"

    git \                ;;

    unzip \        esac

    apt-transport-https \    else

    ca-certificates \        print_error "Cannot detect OS. Exiting."

    gnupg \        exit 1

    lsb-release \    fi

    software-properties-common \}

    htop \

    nano \# Function to install Docker

    vim \install_docker() {

    fail2ban \    print_status "Installing Docker..."

    ufw    

    if command -v docker > /dev/null 2>&1; then

# Install Docker        print_status "Docker already installed"

print_header "Installing Docker"        docker --version

if ! command -v docker > /dev/null 2>&1; then        return

    print_status "Installing Docker..."    fi

        

    # Add Docker's official GPG key    case $PKG_MANAGER in

    $SUDO install -m 0755 -d /etc/apt/keyrings        "apt-get")

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg            sudo $UPDATE_CMD

    $SUDO chmod a+r /etc/apt/keyrings/docker.gpg            sudo $INSTALL_CMD ca-certificates curl gnupg lsb-release

                sudo mkdir -p /etc/apt/keyrings

    # Add Docker repository            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    echo \            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \            sudo $UPDATE_CMD

      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \            sudo $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

      $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null            ;;

            "yum")

    # Install Docker Engine            sudo $INSTALL_CMD yum-utils

    $SUDO apt-get update            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

    $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin            sudo $INSTALL_CMD docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

                ;;

    # Add current user to docker group    esac

    $SUDO usermod -aG docker $USER    

        # Start and enable Docker

    print_status "Docker installed successfully"    sudo systemctl start docker

else    sudo systemctl enable docker

    print_status "Docker is already installed"    

fi    # Add current user to docker group

    sudo usermod -aG docker $USER

# Start and enable Docker    

print_status "Starting Docker service..."    print_status "Docker installed successfully"

$SUDO systemctl start docker    print_warning "You may need to log out and back in for docker group permissions to take effect"

$SUDO systemctl enable docker}



# Install Docker Compose (standalone)# Function to install essential tools

print_header "Installing Docker Compose"install_tools() {

if ! command -v docker-compose > /dev/null 2>&1; then    print_status "Installing essential tools..."

    print_status "Installing Docker Compose..."    

    DOCKER_COMPOSE_VERSION="v2.21.0"    case $PKG_MANAGER in

    $SUDO curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose        "apt-get")

    $SUDO chmod +x /usr/local/bin/docker-compose            sudo $UPDATE_CMD

    print_status "Docker Compose installed successfully"            sudo $INSTALL_CMD curl wget git htop nano

else            ;;

    print_status "Docker Compose is already installed"        "yum")

fi            sudo $INSTALL_CMD curl wget git htop nano

            ;;

# Install Node.js (for potential builds)    esac

print_header "Installing Node.js"}

if ! command -v node > /dev/null 2>&1; then

    print_status "Installing Node.js..."# Function to set up script permissions

    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -setup_permissions() {

    $SUDO apt-get install -y nodejs    print_status "Setting up script permissions..."

    print_status "Node.js installed successfully"    

else    # Make scripts executable

    print_status "Node.js is already installed"    chmod +x scripts/deploy.sh

fi    chmod +x scripts/cleanup-disk.sh

    chmod +x scripts/setup-ec2.sh

# Configure firewall    

print_header "Configuring Firewall"    # Create logs directory

print_status "Setting up UFW firewall rules..."    mkdir -p logs

    

# Reset UFW to default    print_status "Script permissions set up"

$SUDO ufw --force reset}



# Set default policies# Function to check disk space

$SUDO ufw default deny incomingcheck_disk_space() {

$SUDO ufw default allow outgoing    print_status "Checking disk space..."

    

# Allow SSH (be careful with this!)    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')

$SUDO ufw allow ssh    AVAILABLE_GB=$((AVAILABLE_SPACE / 1024 / 1024))

$SUDO ufw allow 22/tcp    

    print_status "Available disk space: ${AVAILABLE_GB}GB"

# Allow HTTP and HTTPS    

$SUDO ufw allow 80/tcp    if [ $AVAILABLE_GB -lt 5 ]; then

$SUDO ufw allow 443/tcp        print_error "Insufficient disk space (${AVAILABLE_GB}GB). Recommended minimum: 5GB"

        print_status "Running cleanup to free space..."

# Enable UFW        ./scripts/cleanup-disk.sh

$SUDO ufw --force enable    else

        print_status "Disk space looks good!"

print_status "Firewall configured successfully"    fi

}

# Create application directory

print_header "Setting up Application Directory"# Function to create environment file template

APP_DIR="/opt/flipdocs"create_env_template() {

if [ ! -d "$APP_DIR" ]; then    print_status "Creating environment file template..."

    $SUDO mkdir -p "$APP_DIR"    

    $SUDO chown -R $USER:$USER "$APP_DIR"    if [ ! -f .env.production ]; then

    print_status "Application directory created at $APP_DIR"        cat > .env.production << EOF

else# Production Environment Variables for FlipDocs

    print_status "Application directory already exists at $APP_DIR"# Copy this file and update with your actual values

fi

# Database Configuration

# Clone repository (optional)DATABASE_URL=your_database_url_here

print_header "Repository Setup"

read -p "Do you want to clone the FlipDocs repository? (y/n): " -n 1 -r# Clerk Authentication

echoCLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

if [[ $REPLY =~ ^[Yy]$ ]]; thenCLERK_SECRET_KEY=your_clerk_secret_key

    read -p "Enter the repository URL: " REPO_URL

    if [ -n "$REPO_URL" ]; then# Supabase Configuration

        cd "$APP_DIR"SUPABASE_URL=your_supabase_url

        if [ ! -d ".git" ]; thenSUPABASE_ANON_KEY=your_supabase_anon_key

            git clone "$REPO_URL" .SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

            print_status "Repository cloned successfully"

        else# Storage Configuration

            print_status "Repository already exists, pulling latest changes..."STORAGE_BUCKET=your_storage_bucket

            git pull origin main

        fi# API Configuration

    fiAPI_URL=http://localhost:3001

fiNEXT_PUBLIC_API_URL=http://localhost:3001



# Create environment file template# Redis Configuration (optional)

print_header "Environment Configuration"REDIS_URL=redis://redis:6379

ENV_FILE="$APP_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then# Application Configuration

    cat > "$ENV_FILE" << 'EOF'NODE_ENV=production

# FlipDocs Production Environment ConfigurationPORT=3000

NODE_ENV=productionEOF

        print_warning "Created .env.production template. Please update with your actual values!"

# API Configuration    else

PORT=3001        print_status ".env.production already exists"

API_URL=http://localhost:3001    fi

}

# Database Configuration (Update with your actual database details)

DATABASE_URL=postgresql://username:password@localhost:5432/flipdocs# Main setup function

main() {

# Redis Configuration    echo -e "${GREEN}🚀 Setting up EC2 instance for FlipDocs deployment${NC}\n"

REDIS_URL=redis://localhost:6379    

    # Check OS

# Clerk Authentication (Update with your Clerk keys)    check_os

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key    

CLERK_SECRET_KEY=your_clerk_secret_key    # Install essential tools

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in    install_tools

NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up    

NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard    # Install Docker

NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard    install_docker

    

# Supabase Configuration (Update with your Supabase details)    # Set up permissions

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url    setup_permissions

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key    

SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key    # Check disk space

    check_disk_space

# Storage Configuration    

STORAGE_PROVIDER=supabase    # Create environment template

SUPABASE_STORAGE_BUCKET=flipbooks    create_env_template

    

# Application Configuration    echo -e "\n${GREEN}✅ EC2 setup completed!${NC}\n"

NEXT_PUBLIC_APP_URL=https://yourdomain.com    

NEXT_PUBLIC_API_URL=https://yourdomain.com/api    print_status "Next steps:"

    echo "1. Update .env.production with your actual environment variables"

# Security    echo "2. Test Docker: docker --version"

JWT_SECRET=your_jwt_secret_here    echo "3. Run deployment: ./scripts/deploy.sh"

SESSION_SECRET=your_session_secret_here    echo "4. Monitor with: ./scripts/deploy.sh logs"

EOF    

    print_warning "Environment file created at $ENV_FILE"    print_warning "If Docker commands fail, you may need to log out and back in for group permissions to take effect."

    print_warning "Please update the environment variables with your actual configuration"}

else

    print_status "Environment file already exists"# Handle script arguments

ficase "${1:-setup}" in

    "setup")

# Set up log rotation        main

print_header "Setting up Log Rotation"        ;;

$SUDO tee /etc/logrotate.d/flipdocs > /dev/null << 'EOF'    "docker")

/opt/flipdocs/logs/*.log {        install_docker

    daily        ;;

    missingok    "tools")

    rotate 52        install_tools

    compress        ;;

    delaycompress    "permissions")

    notifempty        setup_permissions

    create 644 www-data www-data        ;;

    postrotate    *)

        /usr/bin/docker-compose -f /opt/flipdocs/docker-compose.registry.yml restart nginx 2>/dev/null || true        echo "Usage: $0 {setup|docker|tools|permissions}"

    endscript        echo ""

}        echo "Commands:"

EOF        echo "  setup       - Full EC2 setup (default)"

        echo "  docker      - Install Docker only"

# Create logs directory        echo "  tools       - Install essential tools only"

mkdir -p "$APP_DIR/logs"        echo "  permissions - Set up script permissions only"

        exit 1

# Configure Docker logging        ;;

print_header "Configuring Docker Logging"esac
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

# Create deployment user (if needed)
print_header "User Configuration"
if ! id "deploy" &>/dev/null; then
    $SUDO useradd -m -s /bin/bash deploy
    $SUDO usermod -aG docker deploy
    $SUDO usermod -aG sudo deploy
    print_status "Deploy user created"
else
    print_status "Deploy user already exists"
fi

# Install monitoring tools
print_header "Installing Monitoring Tools"
$SUDO apt-get install -y htop iotop nethogs

# Create systemd service for auto-start (optional)
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
ExecStart=/usr/local/bin/docker-compose -f docker-compose.registry.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.registry.yml down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

    $SUDO systemctl daemon-reload
    $SUDO systemctl enable flipdocs.service
    print_status "Systemd service created and enabled"
fi

# Display system information
print_header "System Information"
echo -e "${GREEN}Docker version:${NC} $(docker --version)"
echo -e "${GREEN}Docker Compose version:${NC} $(docker-compose --version)"
echo -e "${GREEN}Node.js version:${NC} $(node --version)"
echo -e "${GREEN}Available memory:${NC} $(free -h | grep ^Mem | awk '{print $2}')"
echo -e "${GREEN}Available disk space:${NC} $(df -h / | awk 'NR==2{print $4}')"
echo -e "${GREEN}Application directory:${NC} $APP_DIR"

print_header "Next Steps"
echo -e "${BLUE}1.${NC} Update the environment file: $ENV_FILE"
echo -e "${BLUE}2.${NC} Configure your domain DNS to point to this server"
echo -e "${BLUE}3.${NC} Set up SSL certificates (use Let's Encrypt with Certbot)"
echo -e "${BLUE}4.${NC} Configure GitHub secrets for deployment:"
echo "   - EC2_HOST: Your EC2 instance IP or domain"
echo "   - EC2_USER: Your EC2 username (ubuntu/ec2-user)"
echo "   - EC2_SSH_KEY: Your private SSH key for EC2 access"
echo -e "${BLUE}5.${NC} Run the deployment from your local machine or GitHub Actions"

print_header "Important Security Notes"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   - Change default passwords"
echo "   - Configure SSL/HTTPS"
echo "   - Set up proper backup procedures"
echo "   - Monitor system resources"
echo "   - Keep system packages updated"

echo -e "\n${GREEN}🎉 EC2 setup completed successfully!${NC}"
echo -e "${GREEN}You can now deploy FlipDocs to this server.${NC}"

# Logout required message
echo -e "\n${YELLOW}⚠️  Please log out and log back in for Docker group membership to take effect.${NC}"