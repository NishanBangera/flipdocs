#!/bin/bash
set -e

REGISTRY=$(grep '^REGISTRY=' .env | sed 's/REGISTRY=//')

echo "🧹 Removing old images from $REGISTRY"
for image in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep $REGISTRY 2>/dev/null || true); do
    docker rmi $image 2>/dev/null || true
done

echo "📥 Pulling latest images"
docker-compose pull

echo "🔄 Restarting containers"
docker-compose up -d

echo "✅ Update complete!"
echo "🌐 Application: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'localhost')"

docker-compose ps