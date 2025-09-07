@echo off
REM Masterminds Q&A Platform Deployment Script for Windows
setlocal enabledelayedexpansion

echo 🚀 Masterminds Q&A Platform Deployment
echo =======================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Parse command line arguments
set ENVIRONMENT=development
set BUILD_OPTION=
set MIGRATE_OPTION=

:parse_args
if "%1"=="" goto after_parse
if "%1"=="--prod" (
    set ENVIRONMENT=production
    shift
    goto parse_args
)
if "%1"=="--production" (
    set ENVIRONMENT=production
    shift
    goto parse_args
)
if "%1"=="--build" (
    set BUILD_OPTION=--build
    shift
    goto parse_args
)
if "%1"=="--migrate" (
    set MIGRATE_OPTION=yes
    shift
    goto parse_args
)
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

echo [ERROR] Unknown option: %1
echo Use --help for usage information.
exit /b 1

:show_help
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --prod, --production    Deploy in production mode
echo   --build                 Force rebuild of Docker images
echo   --migrate              Run database migrations
echo   --help, -h             Show this help message
echo.
echo Examples:
echo   %0                     # Development deployment
echo   %0 --prod --build      # Production deployment with rebuild
echo   %0 --migrate           # Development with migrations
exit /b 0

:after_parse
echo [INFO] Deployment Environment: %ENVIRONMENT%

REM Set compose file based on environment
if "%ENVIRONMENT%"=="production" (
    set COMPOSE_FILE=docker-compose.prod.yml
    set ENV_FILE=.env.prod
    
    if not exist "%ENV_FILE%" (
        echo [ERROR] Production environment file ^(%ENV_FILE%^) not found!
        echo [INFO] Please copy .env.prod.example to %ENV_FILE% and configure your production values.
        exit /b 1
    )
    
    echo [WARNING] Deploying to PRODUCTION environment!
    set /p REPLY="Are you sure you want to continue? (y/N) "
    if /i not "%REPLY%"=="y" (
        echo [INFO] Deployment cancelled.
        exit /b 1
    )
) else (
    set COMPOSE_FILE=docker-compose.yml
    set ENV_FILE=.env
)

if not exist "%ENV_FILE%" (
    echo [WARNING] Environment file ^(%ENV_FILE%^) not found. Using defaults.
)

echo [INFO] Using compose file: %COMPOSE_FILE%

REM Stop existing services
echo [INFO] Stopping existing services...
docker-compose -f %COMPOSE_FILE% down

REM Remove old containers and images if building
if "%BUILD_OPTION%"=="--build" (
    echo [INFO] Removing old images...
    docker-compose -f %COMPOSE_FILE% down --rmi all
    docker system prune -f
)

REM Build and start services
echo [INFO] Starting services...
if "%BUILD_OPTION%"=="--build" (
    docker-compose -f %COMPOSE_FILE% up -d --build
) else (
    docker-compose -f %COMPOSE_FILE% up -d
)

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

REM PostgreSQL
docker-compose -f %COMPOSE_FILE% exec postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] PostgreSQL is ready
) else (
    echo [ERROR] PostgreSQL is not ready
)

REM Redis
docker-compose -f %COMPOSE_FILE% exec redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Redis is ready
) else (
    echo [ERROR] Redis is not ready
)

REM Backend
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend is ready
) else (
    echo [WARNING] Backend health check failed
)

REM Frontend (only check in production)
if "%ENVIRONMENT%"=="production" (
    curl -f http://localhost:3000 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Frontend is ready
    ) else (
        echo [WARNING] Frontend health check failed
    )
)

REM Run migrations if requested
if "%MIGRATE_OPTION%"=="yes" (
    echo [INFO] Running database migrations...
    docker-compose -f %COMPOSE_FILE% exec backend npm run migration:run
    echo [SUCCESS] Migrations completed
)

REM Show running services
echo [INFO] Running services:
docker-compose -f %COMPOSE_FILE% ps

echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo [INFO] Access your application:
if "%ENVIRONMENT%"=="production" (
    echo   Frontend: http://localhost
    echo   Backend API: http://localhost/api
    echo   GraphQL Playground: http://localhost/graphql
) else (
    echo   Frontend: http://localhost:10021
    echo   Backend API: http://localhost:3001/api
    echo   GraphQL Playground: http://localhost:3001/graphql
)
echo   PostgreSQL: localhost:5432
echo   Redis: localhost:6379
echo.
echo [INFO] Useful commands:
echo   View logs: docker-compose -f %COMPOSE_FILE% logs -f
echo   Stop services: docker-compose -f %COMPOSE_FILE% down
echo   Restart services: docker-compose -f %COMPOSE_FILE% restart
echo   Run migrations: docker-compose -f %COMPOSE_FILE% exec backend npm run migration:run
echo   Access database: docker-compose -f %COMPOSE_FILE% exec postgres psql -U postgres -d masterminds

pause