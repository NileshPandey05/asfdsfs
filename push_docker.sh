#!/usr/bin/env bash
set -e

DOCKER_USER="${1:-nilesh2311}"

echo "=================================================="
echo " Wind Forecast Intelligence — Docker Hub Push"
echo " Target Namespace: ${DOCKER_USER}"
echo "=================================================="

# 1. Check if logged in
if ! docker info 2>&1 | grep -q "Username:"; then
  echo "Logging in to Docker Hub as '${DOCKER_USER}'..."
  docker login -u "${DOCKER_USER}"
fi

# 2. Tag images
echo "Tagging backend image..."
docker tag sfsdfs-backend:latest "${DOCKER_USER}/wind-forecast-backend:latest"

echo "Tagging frontend image..."
docker tag sfsdfs-frontend:latest "${DOCKER_USER}/wind-forecast-frontend:latest"

# 3. Push images
echo "Pushing ${DOCKER_USER}/wind-forecast-backend:latest..."
docker push "${DOCKER_USER}/wind-forecast-backend:latest"

echo "Pushing ${DOCKER_USER}/wind-forecast-frontend:latest..."
docker push "${DOCKER_USER}/wind-forecast-frontend:latest"

echo "=================================================="
echo " Successfully pushed images to Docker Hub!"
echo " Backend:  https://hub.docker.com/r/${DOCKER_USER}/wind-forecast-backend"
echo " Frontend: https://hub.docker.com/r/${DOCKER_USER}/wind-forecast-frontend"
echo "=================================================="
