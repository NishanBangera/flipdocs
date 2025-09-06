#!/bin/bash

# SSH Key Validation Script for GitHub Actions
# This script helps validate that your SSH key is in the correct format

echo "🔐 SSH Key Validation for GitHub Actions"
echo "========================================"
echo ""

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/your-key.pem"
    echo ""
    echo "This script validates your SSH key format for GitHub Actions compatibility."
    exit 1
fi

KEY_FILE="$1"

# Check if file exists
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: Key file not found: $KEY_FILE"
    exit 1
fi

echo "📁 Checking file: $KEY_FILE"
echo ""

# Check file permissions
PERMS=$(stat -c "%a" "$KEY_FILE" 2>/dev/null || stat -f "%A" "$KEY_FILE" 2>/dev/null || echo "unknown")
if [ "$PERMS" = "600" ]; then
    echo "✅ File permissions: $PERMS (correct)"
else
    echo "⚠️ File permissions: $PERMS (should be 600)"
    echo "   Fix with: chmod 600 $KEY_FILE"
fi

# Check file size
SIZE=$(wc -c < "$KEY_FILE")
echo "📏 File size: $SIZE bytes"

if [ "$SIZE" -lt 100 ]; then
    echo "❌ File seems too small for a valid SSH key"
    exit 1
elif [ "$SIZE" -gt 10000 ]; then
    echo "⚠️ File seems large - might include extra content"
fi

# Check file format
echo ""
echo "🔍 Key format validation:"

FIRST_LINE=$(head -1 "$KEY_FILE")
LAST_LINE=$(tail -1 "$KEY_FILE")

echo "First line: $FIRST_LINE"
echo "Last line:  $LAST_LINE"

# Validate BEGIN line
if echo "$FIRST_LINE" | grep -q "BEGIN.*PRIVATE KEY"; then
    KEY_TYPE=$(echo "$FIRST_LINE" | sed 's/.*BEGIN \(.*\) PRIVATE KEY.*/\1/')
    echo "✅ Valid BEGIN line detected: $KEY_TYPE"
else
    echo "❌ Invalid or missing BEGIN line"
    echo "   Expected: -----BEGIN RSA PRIVATE KEY----- or -----BEGIN OPENSSH PRIVATE KEY-----"
    exit 1
fi

# Validate END line
if echo "$LAST_LINE" | grep -q "END.*PRIVATE KEY"; then
    echo "✅ Valid END line detected"
else
    echo "❌ Invalid or missing END line"
    echo "   Expected: -----END RSA PRIVATE KEY----- or -----END OPENSSH PRIVATE KEY-----"
    exit 1
fi

# Check for potential issues
echo ""
echo "🔍 Additional checks:"

# Count lines
LINE_COUNT=$(wc -l < "$KEY_FILE")
echo "📄 Line count: $LINE_COUNT"

if [ "$LINE_COUNT" -lt 5 ]; then
    echo "⚠️ Very few lines - key might be corrupted or incomplete"
fi

# Check for Windows line endings
if file "$KEY_FILE" | grep -q "CRLF"; then
    echo "⚠️ Windows line endings detected (CRLF)"
    echo "   Consider converting to Unix format: dos2unix $KEY_FILE"
fi

# Check for common content issues
if grep -q "Proc-Type" "$KEY_FILE"; then
    echo "⚠️ Encrypted private key detected (has passphrase)"
    echo "   GitHub Actions requires unencrypted keys"
    echo "   Remove passphrase with: ssh-keygen -p -f $KEY_FILE"
fi

# Format recommendation
if [ "$KEY_TYPE" = "OPENSSH" ]; then
    echo "⚠️ OpenSSH format detected"
    echo "   GitHub Actions works better with RSA/PEM format"
    echo "   Convert with: ssh-keygen -p -f $KEY_FILE -m PEM"
elif [ "$KEY_TYPE" = "RSA" ]; then
    echo "✅ RSA/PEM format detected (recommended for GitHub Actions)"
fi

echo ""
echo "📋 GitHub Actions Secret Setup:"
echo "   1. Copy the ENTIRE content of this file:"
echo "   2. Go to GitHub repository > Settings > Secrets"
echo "   3. Create secret 'EC2_SSH_KEY' with this content:"
echo ""
echo "📄 File content preview:"
echo "========================================"
head -2 "$KEY_FILE"
echo "..."
echo "[... $(($LINE_COUNT - 4)) lines of key data ...]"
echo "..."
tail -2 "$KEY_FILE"
echo "========================================"
echo ""

if [ "$PERMS" = "600" ] && echo "$FIRST_LINE" | grep -q "BEGIN.*PRIVATE KEY" && echo "$LAST_LINE" | grep -q "END.*PRIVATE KEY"; then
    echo "🎉 Key validation successful!"
    echo "   This key should work with GitHub Actions"
else
    echo "❌ Key validation failed!"
    echo "   Please fix the issues above before using with GitHub Actions"
    exit 1
fi