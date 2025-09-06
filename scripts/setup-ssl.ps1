# FlipDocs SSL Certificate Setup Script (PowerShell)
# This script sets up Let's Encrypt SSL certificates for flipbook.ironasylum.in

param(
    [string]$Mode = "--dry-run"
)

$Domain = "flipbook.ironasylum.in"
$Email = if ($env:SSL_EMAIL) { $env:SSL_EMAIL } else { "admin@ironasylum.in" }

Write-Host "🔒 FlipDocs SSL Certificate Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Cyan
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
if (-not (Test-Path "docker-compose.ssl.yml")) {
    Write-Host "❌ Error: docker-compose.ssl.yml not found" -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating certificate directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "certbot\www" | Out-Null
New-Item -ItemType Directory -Force -Path "certbot\conf" | Out-Null

# Start nginx with initial configuration
Write-Host "🚀 Starting nginx with initial configuration..." -ForegroundColor Yellow
docker-compose -f docker-compose.ssl.yml up -d nginx

# Wait for nginx to be ready
Write-Host "⏳ Waiting for nginx to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Generate SSL certificate
Write-Host "🔐 Generating SSL certificate..." -ForegroundColor Yellow
if ($Mode -eq "--dry-run") {
    Write-Host "🧪 Running in dry-run mode (test mode)..." -ForegroundColor Cyan
    $result = docker-compose -f docker-compose.ssl.yml run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --dry-run --email $Email --agree-tos --no-eff-email -d $Domain -d www.$Domain
} else {
    Write-Host "🎯 Running in production mode..." -ForegroundColor Cyan
    $result = docker-compose -f docker-compose.ssl.yml run --rm certbot certonly --webroot --webroot-path /var/www/certbot/ --email $Email --agree-tos --no-eff-email -d $Domain -d www.$Domain
}

if ($LASTEXITCODE -eq 0) {
    if ($Mode -eq "--dry-run") {
        Write-Host "✅ Dry run successful! You can now run without --dry-run flag:" -ForegroundColor Green
        Write-Host "   .\scripts\setup-ssl.ps1 --force-renewal" -ForegroundColor White
    } else {
        Write-Host "✅ SSL certificate generated successfully!" -ForegroundColor Green
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Update nginx.conf with HTTPS configuration" -ForegroundColor White
        Write-Host "   2. Restart the services: docker-compose -f docker-compose.ssl.yml restart" -ForegroundColor White
    }
} else {
    Write-Host "❌ Certificate generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Certificate files location:" -ForegroundColor Cyan
Write-Host "   - Full chain: certbot\conf\live\$Domain\fullchain.pem" -ForegroundColor White
Write-Host "   - Private key: certbot\conf\live\$Domain\privkey.pem" -ForegroundColor White