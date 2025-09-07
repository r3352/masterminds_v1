#!/bin/bash

# ==================================================
#  Kondon - Expert Q&A Platform Startup Script
# ==================================================

echo ""
echo "==============================================="
echo "   KONDON - Expert Q&A Platform"
echo "==============================================="
echo "   Starting up all services..."
echo "   This may take a few minutes on first run."
echo "==============================================="
echo ""

# Check if Docker is running
echo "[1/4] Checking Docker status..."
if ! docker version >/dev/null 2>&1; then
    echo ""
    echo "❌ ERROR: Docker is not running!"
    echo ""
    echo "Please make sure Docker is:"
    echo "  1. Installed on your system"
    echo "  2. Running and ready to accept commands"
    echo ""
    echo "On macOS: Start Docker Desktop"
    echo "On Linux: sudo systemctl start docker"
    echo ""
    echo "Download Docker from: https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi
echo "✅ Docker is running"

echo ""
echo "[2/4] Stopping any existing containers..."
docker-compose down >/dev/null 2>&1

echo ""
echo "[3/4] Building and starting all services..."
echo "This step may take several minutes on first run..."
if ! docker-compose up -d; then
    echo ""
    echo "❌ ERROR: Failed to start services!"
    echo ""
    echo "Please check:"
    echo "  1. Docker is running properly"
    echo "  2. No other services are using ports 3001, 10021, 5433, or 6379"
    echo "  3. You have enough disk space (2GB minimum)"
    echo ""
    echo "For troubleshooting, try running: docker-compose logs"
    echo ""
    exit 1
fi

echo ""
echo "[4/4] Waiting for services to be ready..."
echo "Please wait while all services start up..."

# Wait a bit for services to start
sleep 10

echo ""
echo "==============================================="
echo "   🎉 SYSTEM STARTED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "Your services are now available at:"
echo ""
echo "   📱 Frontend (Main App): http://localhost:10021"
echo "   🔧 Backend API:         http://localhost:3001"
echo "   🗄️  PostgreSQL:         localhost:5433"
echo "   ⚡ Redis:              localhost:6379"
echo ""
echo "==============================================="
echo "   📊 SERVICE STATUS"
echo "==============================================="

# Show service status
docker-compose ps

echo ""
echo "==============================================="
echo "   💡 USEFUL COMMANDS"
echo "==============================================="
echo ""
echo "   View logs:           docker-compose logs -f"
echo "   Restart service:     docker-compose restart [service-name]"
echo "   Stop all services:   ./stop.sh"
echo ""
echo "==============================================="
echo "   🌟 HAPPY CODING!"
echo "==============================================="
echo ""
echo "The system is now ready to use!"
echo "Visit http://localhost:10021 to get started."
echo ""