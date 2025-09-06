#!/bin/bash

# Test SSH Connection Script for GitHub Actions Debugging
# This script helps test SSH connection to EC2 before setting up GitHub Actions

set -e

echo "🔍 GitHub Actions SSH Connection Test"
echo "===================================="
echo ""

# Check if required variables are set
if [ -z "$EC2_HOST" ] || [ -z "$EC2_USERNAME" ] || [ -z "$EC2_SSH_KEY_PATH" ] || [ -z "$EC2_DEPLOYMENT_PATH" ]; then
    echo "❌ Missing required environment variables. Please set:"
    echo "   export EC2_HOST='your-ec2-ip'"
    echo "   export EC2_USERNAME='ubuntu'  # or 'ec2-user' for Amazon Linux"
    echo "   export EC2_SSH_KEY_PATH='/path/to/your-key.pem'"
    echo "   export EC2_DEPLOYMENT_PATH='/home/ubuntu/flipdocs-ssl'  # or '/home/ec2-user/flipdocs-ssl' for Amazon Linux"
    echo ""
    echo "Example (Ubuntu):"
    echo "   export EC2_HOST='52.123.456.789'"
    echo "   export EC2_USERNAME='ubuntu'"
    echo "   export EC2_SSH_KEY_PATH='~/.ssh/my-ec2-key.pem'"
    echo "   export EC2_DEPLOYMENT_PATH='/home/ubuntu/flipdocs-ssl'"
    echo ""
    echo "Example (Amazon Linux):"
    echo "   export EC2_HOST='52.123.456.789'"
    echo "   export EC2_USERNAME='ec2-user'"
    echo "   export EC2_SSH_KEY_PATH='~/.ssh/my-ec2-key.pem'"
    echo "   export EC2_DEPLOYMENT_PATH='/home/ec2-user/flipdocs-ssl'"
    exit 1
fi

echo "🔧 Configuration:"
echo "   Host: $EC2_HOST"
echo "   Username: $EC2_USERNAME"
echo "   SSH Key: $EC2_SSH_KEY_PATH"
echo "   Deployment Path: $EC2_DEPLOYMENT_PATH"
echo ""

# Test 1: Check SSH key exists and has correct permissions
echo "🔐 Testing SSH key..."
if [ ! -f "$EC2_SSH_KEY_PATH" ]; then
    echo "❌ SSH key file not found: $EC2_SSH_KEY_PATH"
    exit 1
fi

# Check permissions
KEY_PERMS=$(stat -c "%a" "$EC2_SSH_KEY_PATH" 2>/dev/null || stat -f "%A" "$EC2_SSH_KEY_PATH" 2>/dev/null || echo "unknown")
if [ "$KEY_PERMS" != "600" ]; then
    echo "⚠️ SSH key permissions are $KEY_PERMS, should be 600"
    echo "   Run: chmod 600 $EC2_SSH_KEY_PATH"
else
    echo "✅ SSH key permissions correct (600)"
fi

# Test 2: Check SSH key format
echo ""
echo "🔍 Checking SSH key format..."
if head -1 "$EC2_SSH_KEY_PATH" | grep -q "BEGIN"; then
    KEY_TYPE=$(head -1 "$EC2_SSH_KEY_PATH" | sed 's/.*BEGIN \(.*\) PRIVATE KEY.*/\1/')
    echo "✅ SSH key format: $KEY_TYPE"
    
    if [ "$KEY_TYPE" = "OPENSSH" ]; then
        echo "⚠️ Warning: OpenSSH format detected. GitHub Actions might prefer RSA format."
        echo "   To convert: ssh-keygen -p -f $EC2_SSH_KEY_PATH -m PEM"
    fi
else
    echo "❌ Invalid SSH key format"
    exit 1
fi

# Test 3: Basic SSH connection
echo ""
echo "🌐 Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$EC2_SSH_KEY_PATH" "$EC2_USERNAME@$EC2_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Verify EC2 instance is running"
    echo "   2. Check security groups allow port 22 from your IP"
    echo "   3. Verify the username is correct:"
    echo "      - 'ubuntu' for Ubuntu instances"
    echo "      - 'ec2-user' for Amazon Linux instances"
    echo "      - 'admin' for Debian instances"
    echo "   4. Ensure the SSH key matches the EC2 instance key pair"
    exit 1
fi

# Test 4: Check deployment directory
echo ""
echo "📁 Testing deployment directory..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$EC2_SSH_KEY_PATH" "$EC2_USERNAME@$EC2_HOST" "[ -d '$EC2_DEPLOYMENT_PATH' ]" 2>/dev/null; then
    echo "✅ Deployment directory exists: $EC2_DEPLOYMENT_PATH"
else
    echo "❌ Deployment directory not found: $EC2_DEPLOYMENT_PATH"
    echo "   Run SSL deployment setup first:"
    echo "   curl -sSL https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deploy-to-ec2.sh | bash"
    exit 1
fi

# Test 5: Check Docker and Docker Compose
echo ""
echo "🐳 Testing Docker environment..."
DOCKER_CHECK=$(ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$EC2_SSH_KEY_PATH" "$EC2_USERNAME@$EC2_HOST" "
    cd '$EC2_DEPLOYMENT_PATH' && \
    echo 'Docker:' \$(docker --version 2>/dev/null || echo 'NOT_FOUND') && \
    echo 'Docker Compose:' \$(docker-compose --version 2>/dev/null || echo 'NOT_FOUND') && \
    echo 'SSL Config:' \$([ -f docker-compose.ssl.yml ] && echo 'FOUND' || echo 'NOT_FOUND') && \
    echo 'Environment:' \$([ -f .env ] && echo 'FOUND' || echo 'NOT_FOUND')
" 2>/dev/null)

echo "$DOCKER_CHECK"

if echo "$DOCKER_CHECK" | grep -q "NOT_FOUND"; then
    echo "❌ Some required components are missing"
    exit 1
else
    echo "✅ Docker environment looks good"
fi

# Test 6: GitHub Actions SSH key format check
echo ""
echo "📋 GitHub Actions SSH Key Setup:"
echo "   Copy the ENTIRE contents of your SSH key file to GitHub secrets:"
echo ""
echo "   Secret Name: EC2_SSH_KEY"
echo "   Secret Value:"
cat "$EC2_SSH_KEY_PATH"
echo ""
echo "   Make sure to include the BEGIN/END lines!"

echo ""
echo "🎉 All tests passed! Your SSH setup should work with GitHub Actions."
echo ""
echo "📝 GitHub Secrets to configure:"
echo "   EC2_HOST: $EC2_HOST"
echo "   EC2_USERNAME: $EC2_USERNAME"  
echo "   EC2_DEPLOYMENT_PATH: $EC2_DEPLOYMENT_PATH"
echo "   EC2_SSH_KEY: [contents of $EC2_SSH_KEY_PATH]"