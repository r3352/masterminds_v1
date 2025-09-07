@echo off
REM ==================================================
REM  Kondon - Expert Q&A Platform Stop Script
REM ==================================================

echo.
echo ===============================================
echo   KONDON - Expert Q&A Platform
echo ===============================================
echo   Shutting down all services...
echo ===============================================
echo.

REM Check if Docker Desktop is running
echo [1/3] Checking Docker Desktop status...
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ WARNING: Docker Desktop doesn't appear to be running.
    echo.
    echo If services are already stopped, this is normal.
    echo If you're trying to stop running services, please:
    echo   1. Start Docker Desktop
    echo   2. Run this script again
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 0
)
echo ✅ Docker Desktop is running

echo.
echo [2/3] Stopping all Kondon services...
docker-compose down

if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: Failed to stop some services!
    echo.
    echo This might be normal if services were already stopped.
    echo You can check running containers with: docker ps
    echo.
) else (
    echo ✅ All services stopped successfully
)

echo.
echo [3/3] Checking final status...

REM Show any remaining containers
docker-compose ps

echo.
echo ===============================================
echo   🛑 SYSTEM STOPPED
echo ===============================================
echo.
echo All Kondon services have been stopped.
echo.
echo To completely remove all data (clean reset):
echo   docker-compose down -v
echo.
echo To start the system again:
echo   Double-click start.bat
echo.
echo ===============================================
echo   📊 CLEANUP OPTIONS
echo ===============================================
echo.
echo Would you like to perform additional cleanup?
echo.
echo [1] Stop only (keeps data) - RECOMMENDED
echo [2] Remove all data (clean reset)
echo [3] Remove everything (images, data, etc.)
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo ✅ Services stopped, data preserved.
    echo Your data will be available when you restart.
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo ⚠️  Removing all data volumes...
    echo This will delete all database data, uploaded files, etc.
    docker-compose down -v
    echo ✅ All data removed. Next start will be fresh.
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo ⚠️  WARNING: This will remove EVERYTHING including Docker images!
    echo You'll need to download and rebuild everything on next start.
    echo.
    set /p confirm="Are you sure? This will take much longer to restart. (y/N): "
    
    if /i "%confirm%"=="y" (
        echo.
        echo Removing all containers, networks, volumes, and images...
        docker-compose down -v --rmi all --remove-orphans
        echo.
        echo ✅ Complete cleanup finished.
        echo Next start will download and build everything fresh.
    ) else (
        echo.
        echo ✅ Cleanup cancelled. Services stopped, data preserved.
    )
    goto :end
)

echo.
echo Invalid choice. Services stopped, data preserved.

:end
echo.
echo ===============================================
echo   👋 GOODBYE!
echo ===============================================
echo.
echo Press any key to exit...
pause >nul