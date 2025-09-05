#!/bin/bash

# Simple Update Script for FlipDocs
# Based on the sleep-scoring reference implementation

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Get registry from environment
REGISTRY=$(grep '^REGISTRY=' .env | sed 's/REGISTRY=//' || echo "ghcr.io/nishanbangera")

echo "🧹 Removing all images from registry $REGISTRY"
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep $REGISTRY); do
  echo "Removing image $image"
  docker rmi $image
done

echo "📥 Pulling latest images from registry $REGISTRY"
docker compose -f docker-compose.simple.yml pull

echo "🔄 Restarting containers"
docker compose -f docker-compose.simple.yml up -d

echo "✅ Update complete!"
echo "🌐 Your application is running at: http://localhost"

# Optional: Show status
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.simple.yml ps