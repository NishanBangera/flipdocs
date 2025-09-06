# FlipDocs SSL Certificate Setup Script (PowerShell)
# This script sets up Let's Encrypt SSL certificates for flipbook.ironasylum.in
# Designed for EC2 deployment with GHCR container images

param(
    [string]$Mode = "--dry-run",
    [switch]$NoEmail
)

$Domain = "flipbook.ironasylum.in"
$Email = if ($env:SSL_EMAIL) { $env:SSL_EMAIL } else { "admin@ironasylum.in" }
$ComposeFile = "docker-compose.ssl.yml"

# Set email configuration based on --no-email flag
$EmailArg = ""
if ($NoEmail) {
    $EmailArg = "--register-unsafely-without-email"
    Write-Host "⚠️  Warning: Running without email registration (not recommended for production)" -ForegroundColor Yellow
} else {
    $EmailArg = "--email $Email"
}

Write-Host "🔒 FlipDocs SSL Certificate Setup (GHCR Deployment)" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Cyan
if (-not $NoEmail) {
    Write-Host "Email: $Email" -ForegroundColor Cyan
} else {
    Write-Host "Email: Not provided (unsafe mode)" -ForegroundColor Yellow
}
Write-Host "Mode: $Mode" -ForegroundColor Cyan
Write-Host ""

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ Error: docker-compose is not installed" -ForegroundColor Red
    exit 1
}

# Check if the SSL compose file exists
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ Error: $ComposeFile not found" -ForegroundColor Red
    Write-Host "📝 Make sure you have the deployment files on your EC2 instance" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "📝 Please copy .env.ssl.example to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating certificate directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "certbot\www" | Out-Null
New-Item -ItemType Directory -Force -Path "certbot\conf" | Out-Null
New-Item -ItemType Directory -Force -Path "data\storage" | Out-Null

# Pull latest images from GHCR
Write-Host "📦 Pulling latest container images from GHCR..." -ForegroundColor Yellow
docker-compose -f $ComposeFile pull

# Start nginx with initial configuration
Write-Host "🚀 Starting nginx with initial configuration..." -ForegroundColor Yellow
docker-compose -f $ComposeFile up -d nginx

# Wait for nginx to be ready
Write-Host "⏳ Waiting for nginx to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if nginx is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost/.well-known/acme-challenge/" -TimeoutSec 5 -ErrorAction SilentlyContinue
} catch {
    Write-Host "⚠️  Note: Nginx ACME challenge endpoint check failed, but continuing..." -ForegroundColor Yellow
}

# Generate SSL certificate
Write-Host "🔐 Generating SSL certificate..." -ForegroundColor Yellow
if ($Mode -eq "--dry-run") {
    Write-Host "🧪 Running in dry-run mode (test mode)..." -ForegroundColor Cyan
    $result = docker-compose -f $ComposeFile run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run $EmailArg --agree-tos --no-eff-email -d $Domain
} else {
    Write-Host "🎯 Running in production mode..." -ForegroundColor Cyan
    $result = docker-compose -f $ComposeFile run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ $EmailArg --agree-tos --no-eff-email -d $Domain
}

if ($LASTEXITCODE -eq 0) {
    if ($Mode -eq "--dry-run") {
        Write-Host "✅ Dry run successful! You can now run:" -ForegroundColor Green
        if ($NoEmail) {
            Write-Host "   .\setup-ssl.ps1 --force-renewal -NoEmail" -ForegroundColor White
        } else {
            Write-Host "   .\setup-ssl.ps1 --force-renewal" -ForegroundColor White
        }
    } else {
        if ($NoEmail) {
            Write-Host "✅ SSL certificate generated successfully (without email registration)!" -ForegroundColor Green
        } else {
            Write-Host "✅ SSL certificate generated successfully!" -ForegroundColor Green
        }
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Copy nginx.ssl.conf to nginx.conf: Copy-Item nginx.ssl.conf nginx.conf" -ForegroundColor White
        Write-Host "   2. Restart all services: docker-compose -f $ComposeFile restart" -ForegroundColor White
        Write-Host "   3. Start all services: docker-compose -f $ComposeFile up -d" -ForegroundColor White
    }
} else {
    Write-Host "❌ Certificate generation failed!" -ForegroundColor Red
    Write-Host "🔍 Check the logs: docker-compose -f $ComposeFile logs certbot" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔍 Certificate files location:" -ForegroundColor Cyan
Write-Host "   - Full chain: certbot\conf\live\$Domain\fullchain.pem" -ForegroundColor White
Write-Host "   - Private key: certbot\conf\live\$Domain\privkey.pem" -ForegroundColor White
Write-Host ""
Write-Host "🌐 After successful setup, your application will be available at:" -ForegroundColor Cyan
Write-Host "   https://$Domain" -ForegroundColor White