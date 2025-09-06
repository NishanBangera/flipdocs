# FlipDocs SSL Certificate Renewal Script (PowerShell)
# This script renews Let's Encrypt SSL certificates automatically

$Domain = "flipbook.ironasylum.in"
$ComposeFile = "docker-compose.ssl.yml"

Write-Host "🔄 FlipDocs SSL Certificate Renewal" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Domain: $Domain" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
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
    exit 1
}

# Renew certificates
Write-Host "🔐 Renewing SSL certificates..." -ForegroundColor Yellow
$renewResult = docker-compose -f $ComposeFile run --rm certbot renew

# Check renewal result
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Certificate renewal completed successfully!" -ForegroundColor Green
    
    # Reload nginx to use new certificates
    Write-Host "🔄 Reloading nginx configuration..." -ForegroundColor Yellow
    $reloadResult = docker-compose -f $ComposeFile exec nginx nginx -s reload
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Nginx reloaded successfully!" -ForegroundColor Green
        Write-Host "📧 Sending renewal notification..." -ForegroundColor Cyan
        
        # Optional: Send notification (uncomment if you have a notification system)
        # Invoke-RestMethod -Uri "your-webhook-url" -Method Post -Body "SSL certificates for $Domain renewed successfully"
        
    } else {
        Write-Host "⚠️  Warning: Nginx reload failed, but certificates were renewed" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Certificate renewal failed!" -ForegroundColor Red
    Write-Host "📧 Sending failure notification..." -ForegroundColor Cyan
    
    # Optional: Send failure notification (uncomment if you have a notification system)
    # Invoke-RestMethod -Uri "your-webhook-url" -Method Post -Body "SSL certificate renewal failed for $Domain"
    
    exit 1
}

Write-Host ""
Write-Host "🔍 Certificate status:" -ForegroundColor Cyan
docker-compose -f $ComposeFile exec certbot certbot certificates

Write-Host ""
Write-Host "✨ Renewal process completed at $(Get-Date)" -ForegroundColor Green