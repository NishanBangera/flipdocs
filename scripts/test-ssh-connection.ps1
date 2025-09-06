# Test SSH Connection Script for GitHub Actions Debugging (PowerShell)
# This script helps test SSH connection to EC2 before setting up GitHub Actions

param(
    [Parameter(Mandatory=$true)]
    [string]$EC2_HOST,
    
    [Parameter(Mandatory=$true)]
    [string]$EC2_USERNAME,
    
    [Parameter(Mandatory=$true)]
    [string]$EC2_SSH_KEY_PATH,
    
    [Parameter(Mandatory=$true)]
    [string]$EC2_DEPLOYMENT_PATH
)

Write-Host "🔍 GitHub Actions SSH Connection Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔧 Configuration:" -ForegroundColor Yellow
Write-Host "   Host: $EC2_HOST"
Write-Host "   Username: $EC2_USERNAME"
Write-Host "   SSH Key: $EC2_SSH_KEY_PATH"
Write-Host "   Deployment Path: $EC2_DEPLOYMENT_PATH"
Write-Host ""

# Test 1: Check SSH key exists
Write-Host "🔐 Testing SSH key..." -ForegroundColor Yellow
if (-not (Test-Path $EC2_SSH_KEY_PATH)) {
    Write-Host "❌ SSH key file not found: $EC2_SSH_KEY_PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH key file exists" -ForegroundColor Green

# Test 2: Check SSH key format
Write-Host ""
Write-Host "🔍 Checking SSH key format..." -ForegroundColor Yellow
$firstLine = Get-Content $EC2_SSH_KEY_PATH | Select-Object -First 1
if ($firstLine -match "BEGIN") {
    $keyType = $firstLine -replace ".*BEGIN (.*) PRIVATE KEY.*", '$1'
    Write-Host "✅ SSH key format: $keyType" -ForegroundColor Green
    
    if ($keyType -eq "OPENSSH") {
        Write-Host "⚠️ Warning: OpenSSH format detected. GitHub Actions might prefer RSA format." -ForegroundColor Yellow
        Write-Host "   To convert: ssh-keygen -p -f $EC2_SSH_KEY_PATH -m PEM"
    }
} else {
    Write-Host "❌ Invalid SSH key format" -ForegroundColor Red
    exit 1
}

# Test 3: Test SSH connection (requires OpenSSH client)
Write-Host ""
Write-Host "🌐 Testing SSH connection..." -ForegroundColor Yellow

try {
    $sshResult = & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i $EC2_SSH_KEY_PATH "$EC2_USERNAME@$EC2_HOST" "echo 'SSH connection successful'" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful" -ForegroundColor Green
    } else {
        throw "SSH connection failed"
    }
} catch {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "   1. Verify EC2 instance is running"
    Write-Host "   2. Check security groups allow port 22 from your IP"
    Write-Host "   3. Verify the username is correct:"
    Write-Host "      - 'ubuntu' for Ubuntu instances"
    Write-Host "      - 'ec2-user' for Amazon Linux instances"
    Write-Host "      - 'admin' for Debian instances"
    Write-Host "   4. Ensure the SSH key matches the EC2 instance key pair"
    Write-Host "   5. Make sure OpenSSH client is installed (Windows 10/11 feature)"
    exit 1
}

# Test 4: Check deployment directory
Write-Host ""
Write-Host "📁 Testing deployment directory..." -ForegroundColor Yellow
try {
    & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i $EC2_SSH_KEY_PATH "$EC2_USERNAME@$EC2_HOST" "[ -d '$EC2_DEPLOYMENT_PATH' ]" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment directory exists: $EC2_DEPLOYMENT_PATH" -ForegroundColor Green
    } else {
        throw "Directory not found"
    }
} catch {
    Write-Host "❌ Deployment directory not found: $EC2_DEPLOYMENT_PATH" -ForegroundColor Red
    Write-Host "   Run SSL deployment setup first:"
    Write-Host "   curl -sSL https://raw.githubusercontent.com/NishanBangera/flipdocs/main/deploy-to-ec2.sh | bash"
    exit 1
}

# Test 5: Check Docker environment
Write-Host ""
Write-Host "🐳 Testing Docker environment..." -ForegroundColor Yellow
try {
    $dockerCheck = & ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i $EC2_SSH_KEY_PATH "$EC2_USERNAME@$EC2_HOST" @"
cd '$EC2_DEPLOYMENT_PATH' && \
echo 'Docker:' `$(docker --version 2>/dev/null || echo 'NOT_FOUND') && \
echo 'Docker Compose:' `$(docker-compose --version 2>/dev/null || echo 'NOT_FOUND') && \
echo 'SSL Config:' `$([ -f docker-compose.ssl.yml ] && echo 'FOUND' || echo 'NOT_FOUND') && \
echo 'Environment:' `$([ -f .env ] && echo 'FOUND' || echo 'NOT_FOUND')
"@ 2>$null

    Write-Host $dockerCheck

    if ($dockerCheck -match "NOT_FOUND") {
        Write-Host "❌ Some required components are missing" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Docker environment looks good" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to check Docker environment" -ForegroundColor Red
    exit 1
}

# Test 6: GitHub Actions SSH key format check
Write-Host ""
Write-Host "📋 GitHub Actions SSH Key Setup:" -ForegroundColor Cyan
Write-Host "   Copy the ENTIRE contents of your SSH key file to GitHub secrets:"
Write-Host ""
Write-Host "   Secret Name: EC2_SSH_KEY" -ForegroundColor Yellow
Write-Host "   Secret Value:" -ForegroundColor Yellow
Write-Host ""
Get-Content $EC2_SSH_KEY_PATH | Write-Host
Write-Host ""
Write-Host "   Make sure to include the BEGIN/END lines!" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 All tests passed! Your SSH setup should work with GitHub Actions." -ForegroundColor Green
Write-Host ""
Write-Host "📝 GitHub Secrets to configure:" -ForegroundColor Cyan
Write-Host "   EC2_HOST: $EC2_HOST"
Write-Host "   EC2_USERNAME: $EC2_USERNAME"
Write-Host "   EC2_DEPLOYMENT_PATH: $EC2_DEPLOYMENT_PATH"
Write-Host "   EC2_SSH_KEY: [contents of $EC2_SSH_KEY_PATH]"

Write-Host ""
Write-Host "📖 Usage Examples:" -ForegroundColor Cyan
Write-Host "Ubuntu:" -ForegroundColor Yellow
Write-Host ".\test-ssh-connection.ps1 -EC2_HOST '52.123.456.789' -EC2_USERNAME 'ubuntu' -EC2_SSH_KEY_PATH 'C:\path\to\key.pem' -EC2_DEPLOYMENT_PATH '/home/ubuntu/flipdocs-ssl'"
Write-Host "Amazon Linux:" -ForegroundColor Yellow
Write-Host ".\test-ssh-connection.ps1 -EC2_HOST '52.123.456.789' -EC2_USERNAME 'ec2-user' -EC2_SSH_KEY_PATH 'C:\path\to\key.pem' -EC2_DEPLOYMENT_PATH '/home/ec2-user/flipdocs-ssl'"