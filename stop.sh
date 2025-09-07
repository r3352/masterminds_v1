#!/bin/bash

# ==================================================
#  Kondon - Expert Q&A Platform Stop Script
# ==================================================

echo ""
echo "==============================================="
echo "   KONDON - Expert Q&A Platform"
echo "==============================================="
echo "   Shutting down all services..."
echo "==============================================="
echo ""

# Check if Docker is running
echo "[1/3] Checking Docker status..."
if ! docker version >/dev/null 2>&1; then
    echo ""
    echo "❌ WARNING: Docker doesn't appear to be running."
    echo ""
    echo "If services are already stopped, this is normal."
    echo "If you're trying to stop running services, please:"
    echo "  1. Start Docker"
    echo "  2. Run this script again"
    echo ""
    exit 0
fi
echo "✅ Docker is running"

echo ""
echo "[2/3] Stopping all Kondon services..."
if ! docker-compose down; then
    echo ""
    echo "❌ ERROR: Failed to stop some services!"
    echo ""
    echo "This might be normal if services were already stopped."
    echo "You can check running containers with: docker ps"
    echo ""
else
    echo "✅ All services stopped successfully"
fi

echo ""
echo "[3/3] Checking final status..."

# Show any remaining containers
docker-compose ps

echo ""
echo "==============================================="
echo "   🛑 SYSTEM STOPPED"
echo "==============================================="
echo ""
echo "All Kondon services have been stopped."
echo ""
echo "To completely remove all data (clean reset):"
echo "   docker-compose down -v"
echo ""
echo "To start the system again:"
echo "   ./start.sh"
echo ""
echo "==============================================="
echo "   📊 CLEANUP OPTIONS"
echo "==============================================="
echo ""
echo "Would you like to perform additional cleanup?"
echo ""
echo "[1] Stop only (keeps data) - RECOMMENDED"
echo "[2] Remove all data (clean reset)"
echo "[3] Remove everything (images, data, etc.)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "✅ Services stopped, data preserved."
        echo "Your data will be available when you restart."
        ;;
    2)
        echo ""
        echo "⚠️  Removing all data volumes..."
        echo "This will delete all database data, uploaded files, etc."
        docker-compose down -v
        echo "✅ All data removed. Next start will be fresh."
        ;;
    3)
        echo ""
        echo "⚠️  WARNING: This will remove EVERYTHING including Docker images!"
        echo "You'll need to download and rebuild everything on next start."
        echo ""
        read -p "Are you sure? This will take much longer to restart. (y/N): " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            echo ""
            echo "Removing all containers, networks, volumes, and images..."
            docker-compose down -v --rmi all --remove-orphans
            echo ""
            echo "✅ Complete cleanup finished."
            echo "Next start will download and build everything fresh."
        else
            echo ""
            echo "✅ Cleanup cancelled. Services stopped, data preserved."
        fi
        ;;
    *)
        echo ""
        echo "Invalid choice. Services stopped, data preserved."
        ;;
esac

echo ""
echo "==============================================="
echo "   👋 GOODBYE!"
echo "==============================================="
echo ""