#!/bin/bash

# Quick test script to determine correct Docker Compose command

echo "🔍 Testing Docker Compose commands..."

if command -v "docker-compose" > /dev/null 2>&1; then
    echo "✅ Found: docker-compose (legacy)"
    DOCKER_COMPOSE="docker-compose"
    echo "Testing: $DOCKER_COMPOSE --version"
    $DOCKER_COMPOSE --version
elif docker compose version > /dev/null 2>&1; then
    echo "✅ Found: docker compose (new)"
    DOCKER_COMPOSE="docker compose"
    echo "Testing: $DOCKER_COMPOSE version"
    $DOCKER_COMPOSE version
else
    echo "❌ Neither 'docker-compose' nor 'docker compose' is available"
    exit 1
fi

echo ""
echo "✅ Use this command: $DOCKER_COMPOSE"
echo ""
echo "Testing with your compose file..."
$DOCKER_COMPOSE -f docker-compose.prod.yml config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Docker Compose file is valid"
else
    echo "❌ Docker Compose file has issues"
    echo "Running validation..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml config
fi