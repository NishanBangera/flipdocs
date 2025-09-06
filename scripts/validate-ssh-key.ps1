# SSH Key Validation Script for GitHub Actions (PowerShell)
# This script helps validate that your SSH key is in the correct format

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyFilePath
)

Write-Host "🔐 SSH Key Validation for GitHub Actions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (-not (Test-Path $KeyFilePath)) {
    Write-Host "❌ Error: Key file not found: $KeyFilePath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Checking file: $KeyFilePath" -ForegroundColor Yellow
Write-Host ""

# Check file size
$Size = (Get-Item $KeyFilePath).Length
Write-Host "📏 File size: $Size bytes"

if ($Size -lt 100) {
    Write-Host "❌ File seems too small for a valid SSH key" -ForegroundColor Red
    exit 1
} elseif ($Size -gt 10000) {
    Write-Host "⚠️ File seems large - might include extra content" -ForegroundColor Yellow
}

# Check file format
Write-Host ""
Write-Host "🔍 Key format validation:" -ForegroundColor Yellow

$Content = Get-Content $KeyFilePath
$FirstLine = $Content[0]
$LastLine = $Content[-1]

Write-Host "First line: $FirstLine"
Write-Host "Last line:  $LastLine"

# Validate BEGIN line
if ($FirstLine -match "BEGIN.*PRIVATE KEY") {
    $KeyType = $FirstLine -replace ".*BEGIN (.*) PRIVATE KEY.*", '$1'
    Write-Host "✅ Valid BEGIN line detected: $KeyType" -ForegroundColor Green
} else {
    Write-Host "❌ Invalid or missing BEGIN line" -ForegroundColor Red
    Write-Host "   Expected: -----BEGIN RSA PRIVATE KEY----- or -----BEGIN OPENSSH PRIVATE KEY-----"
    exit 1
}

# Validate END line
if ($LastLine -match "END.*PRIVATE KEY") {
    Write-Host "✅ Valid END line detected" -ForegroundColor Green
} else {
    Write-Host "❌ Invalid or missing END line" -ForegroundColor Red
    Write-Host "   Expected: -----END RSA PRIVATE KEY----- or -----END OPENSSH PRIVATE KEY-----"
    exit 1
}

# Check for potential issues
Write-Host ""
Write-Host "🔍 Additional checks:" -ForegroundColor Yellow

# Count lines
$LineCount = $Content.Count
Write-Host "📄 Line count: $LineCount"

if ($LineCount -lt 5) {
    Write-Host "⚠️ Very few lines - key might be corrupted or incomplete" -ForegroundColor Yellow
}

# Check for common content issues
if ($Content -match "Proc-Type") {
    Write-Host "⚠️ Encrypted private key detected (has passphrase)" -ForegroundColor Yellow
    Write-Host "   GitHub Actions requires unencrypted keys"
    Write-Host "   Remove passphrase with: ssh-keygen -p -f $KeyFilePath"
}

# Format recommendation
if ($KeyType -eq "OPENSSH") {
    Write-Host "⚠️ OpenSSH format detected" -ForegroundColor Yellow
    Write-Host "   GitHub Actions works better with RSA/PEM format"
    Write-Host "   Convert with: ssh-keygen -p -f $KeyFilePath -m PEM"
} elseif ($KeyType -eq "RSA") {
    Write-Host "✅ RSA/PEM format detected (recommended for GitHub Actions)" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 GitHub Actions Secret Setup:" -ForegroundColor Cyan
Write-Host "   1. Copy the ENTIRE content of this file:"
Write-Host "   2. Go to GitHub repository > Settings > Secrets"
Write-Host "   3. Create secret 'EC2_SSH_KEY' with this content:"
Write-Host ""
Write-Host "📄 File content preview:" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ($Content[0..1] -join "`n")
Write-Host "..."
Write-Host "[... $($LineCount - 4) lines of key data ...]"
Write-Host "..."
Write-Host ($Content[-2..-1] -join "`n")
Write-Host "========================================"
Write-Host ""

# Check if validation passed
$ValidationPassed = ($FirstLine -match "BEGIN.*PRIVATE KEY") -and ($LastLine -match "END.*PRIVATE KEY")

if ($ValidationPassed) {
    Write-Host "🎉 Key validation successful!" -ForegroundColor Green
    Write-Host "   This key should work with GitHub Actions"
    
    Write-Host ""
    Write-Host "📄 Copy this content to GitHub secret EC2_SSH_KEY:" -ForegroundColor Cyan
    Write-Host "========================================"
    Get-Content $KeyFilePath | Write-Host
    Write-Host "========================================"
} else {
    Write-Host "❌ Key validation failed!" -ForegroundColor Red
    Write-Host "   Please fix the issues above before using with GitHub Actions"
    exit 1
}

Write-Host ""
Write-Host "📖 Usage: .\validate-ssh-key.ps1 -KeyFilePath 'C:\path\to\your-key.pem'" -ForegroundColor Cyan