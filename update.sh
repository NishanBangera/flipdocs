#!/bin/bash
set -e

REGISTRY=$(grep '^GHCR_REGISTRY=' .env | sed 's/GHCR_REGISTRY=//')

echo "🧹 Removing old images from $REGISTRY"
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep $REGISTRY 2>/dev/null || true); do
    docker rmi $image 2>/dev/null || true
done

echo "📥 Pulling latest images"
docker-compose -f docker-compose.ssl.yml pull

echo "🔄 Restarting containers"
docker-compose -f docker-compose.ssl.yml up -d

echo "✅ Update complete!"
echo "🌐 Application: https://flipbook.ironasylum.in"

docker-compose -f docker-compose.ssl.yml ps