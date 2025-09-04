#!/bin/bash

# AWS EC2 Instance Setup Script for FlipDocs
# This script prepares an Ubuntu EC2 instance for Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Setting up AWS EC2 instance for FlipDocs deployment${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Update system packages
print_status "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
print_status "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add current user to docker group
print_status "Adding user to docker group..."
sudo usermod -aG docker $USER

# Install Node.js and Bun (for development/debugging)
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

print_status "Installing Bun..."
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# Configure firewall
print_status "Configuring UFW firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/flipdocs
sudo chown $USER:$USER /opt/flipdocs

# Create logs directory
print_status "Creating logs directory..."
sudo mkdir -p /var/log/flipdocs
sudo chown $USER:$USER /var/log/flipdocs

# Setup logrotate for application logs
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/flipdocs > /dev/null <<EOF
/var/log/flipdocs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF

# Install AWS CLI
print_status "Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws

# Setup Docker daemon configuration
print_status "Configuring Docker daemon..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  },
  "storage-driver": "overlay2"
}
EOF

# Restart Docker service
sudo systemctl restart docker

# Enable Docker service on boot
sudo systemctl enable docker

# Create swap file (recommended for small instances)
print_status "Creating swap file..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# Setup automatic security updates
print_status "Configuring automatic security updates..."
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Create deployment user (optional)
print_status "Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
    sudo mkdir -p /home/deploy/.ssh
    sudo chown deploy:deploy /home/deploy/.ssh
    sudo chmod 700 /home/deploy/.ssh
fi

# Install monitoring tools
print_status "Installing monitoring tools..."
sudo apt-get install -y htop iotop nethogs

# Create systemd service for auto-starting the application
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/flipdocs.service > /dev/null <<EOF
[Unit]
Description=FlipDocs Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/flipdocs
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable flipdocs

print_status "✅ EC2 instance setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Reboot the instance to apply all changes: sudo reboot"
print_status "2. Clone your repository to /opt/flipdocs"
print_status "3. Configure SSL certificates with Let's Encrypt"
print_status "4. Copy .env.production.example to .env.production and configure"
print_status "5. Run the deployment script"
print_status ""
print_warning "Please reboot the instance now to ensure all changes take effect."