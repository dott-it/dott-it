#!/bin/bash

# Test GitHub Actions workflow locally using act (simple version)
# This script helps test the workflow defined in .github/workflows/test.yml

echo "🚀 Testing GitHub Actions workflow locally (simple mode)..."

# Wait for Docker to be ready
echo "⏳ Waiting for Docker to be ready..."
while ! docker ps > /dev/null 2>&1; do
    echo "   Docker not ready yet, waiting..."
    sleep 2
done
echo "✅ Docker is ready!"

# Test the workflow (without verbose output for faster testing)
echo "🧪 Running workflow test..."
act push --workflows .github/workflows/test.yml --container-architecture linux/amd64

echo "✅ Workflow test completed!" 