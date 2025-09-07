#!/bin/bash

# Masterminds Q&A Platform Deployment Script
set -e

echo "🚀 Masterminds Q&A Platform Deployment"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="development"
BUILD_OPTION=""
MIGRATE_OPTION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            ENVIRONMENT="production"
            shift
            ;;
        --build)
            BUILD_OPTION="--build"
            shift
            ;;
        --migrate)
            MIGRATE_OPTION="yes"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --prod, --production    Deploy in production mode"
            echo "  --build                 Force rebuild of Docker images"
            echo "  --migrate              Run database migrations"
            echo "  --help, -h             Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Development deployment"
            echo "  $0 --prod --build      # Production deployment with rebuild"
            echo "  $0 --migrate           # Development with migrations"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information."
            exit 1
            ;;
    esac
done

print_status "Deployment Environment: $ENVIRONMENT"

# Set compose file based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
    
    # Check if production environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Production environment file ($ENV_FILE) not found!"
        print_status "Please copy .env.prod.example to $ENV_FILE and configure your production values."
        exit 1
    fi
    
    print_warning "Deploying to PRODUCTION environment!"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 1
    fi
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file ($ENV_FILE) not found. Using defaults."
fi

print_status "Using compose file: $COMPOSE_FILE"

# Stop existing services
print_status "Stopping existing services..."
docker-compose -f $COMPOSE_FILE down

# Remove old containers and images if building
if [ "$BUILD_OPTION" = "--build" ]; then
    print_status "Removing old images..."
    docker-compose -f $COMPOSE_FILE down --rmi all
    docker system prune -f
fi

# Build and start services
print_status "Starting services..."
if [ "$BUILD_OPTION" = "--build" ]; then
    docker-compose -f $COMPOSE_FILE up -d --build
else
    docker-compose -f $COMPOSE_FILE up -d
fi

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# PostgreSQL
if docker-compose -f $COMPOSE_FILE exec postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
else
    print_error "PostgreSQL is not ready"
fi

# Redis
if docker-compose -f $COMPOSE_FILE exec redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_error "Redis is not ready"
fi

# Backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend is ready"
else
    print_warning "Backend health check failed"
fi

# Frontend (only check in production)
if [ "$ENVIRONMENT" = "production" ]; then
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is ready"
    else
        print_warning "Frontend health check failed"
    fi
fi

# Run migrations if requested
if [ "$MIGRATE_OPTION" = "yes" ]; then
    print_status "Running database migrations..."
    docker-compose -f $COMPOSE_FILE exec backend npm run migration:run
    print_success "Migrations completed"
fi

# Show running services
print_status "Running services:"
docker-compose -f $COMPOSE_FILE ps

echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
print_status "Access your application:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  GraphQL Playground: http://localhost/graphql"
else
    echo "  Frontend: http://localhost:10021"
    echo "  Backend API: http://localhost:3001/api"
    echo "  GraphQL Playground: http://localhost:3001/graphql"
fi
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
print_status "Useful commands:"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "  Run migrations: docker-compose -f $COMPOSE_FILE exec backend npm run migration:run"
echo "  Access database: docker-compose -f $COMPOSE_FILE exec postgres psql -U postgres -d masterminds"