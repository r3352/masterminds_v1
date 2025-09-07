# Kondon - Expert Q&A Platform

A comprehensive Q&A platform where experts can answer questions, users can set bounties, and AI provides fallback answers when no expert responds within the SLA timeframe.

## 🚀 Quick Start (Recommended)

The easiest way to run this system is using the provided batch files:

### For Windows Users:
1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and make sure it's running

2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kondon
   ```

3. **Start the system**
   - Double-click `start.bat` or run it from command line
   - Wait for all services to start (this may take a few minutes on first run)

4. **Stop the system**
   - Double-click `stop.bat` when you're done

### For Mac/Linux Users:
1. **Install Docker**
   - **Mac**: Download Docker Desktop from https://www.docker.com/products/docker-desktop
   - **Linux**: Install Docker Engine and Docker Compose
   
2. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kondon
   ```

3. **Start the system**
   ```bash
   chmod +x start.sh stop.sh  # Make scripts executable (first time only)
   ./start.sh
   ```

4. **Stop the system**
   ```bash
   ./stop.sh
   ```

### Services will be available at:
- **Frontend (Main App)**: http://localhost:10021
- **Backend API**: http://localhost:3001
- **PostgreSQL Database**: localhost:5433
- **Redis**: localhost:6379

## 📋 Prerequisites

### Required Software:
- **Docker Desktop** (latest version) - **REQUIRED**
- **Git** (for cloning the repository)

### System Requirements:
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for Docker images
- **OS**: Windows 10/11, macOS, or Linux

## 🏗️ System Architecture

This system consists of multiple containerized services:

### Core Services:
- **Frontend** (React/Next.js) - User interface
- **Backend** (Node.js/Express) - API server
- **PostgreSQL** - Main database with pgvector extension
- **Redis** - Caching and session storage

### Additional Services:
- **Dashboard Frontend** - Admin interface
- **Dashboard Backend** - Admin API
- **MCP Server** - Model Context Protocol server
- **Analysis Engine** - Question analysis service
- **Validator** - Data validation service
- **Ollama** - Local AI model server
- **Prometheus** - Metrics collection

## 🚀 Features

- **Q&A System**: Ask questions, provide expert answers
- **Bounty System**: Set rewards for high-quality answers
- **AI Fallback**: Automatic AI answers when no expert responds
- **Real-time Updates**: Live notifications and activity feeds
- **Expert Routing**: AI-powered matching of questions to experts
- **Payment Processing**: Secure escrow system for bounties
- **Reputation System**: Community-driven expert ranking

## 🔧 Manual Setup (Advanced Users)

If you prefer to run commands manually or need to customize the setup:

### 1. Clone and Setup
```bash
git clone <repository-url>
cd kondon
```

### 2. Build and Start Services
```bash
# Build all images
docker-compose build

# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 3. Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean reset)
docker-compose down -v
```

## 🐛 Troubleshooting

### Common Issues:

1. **Docker Desktop not running**
   - Solution: Start Docker Desktop and wait for it to fully load

2. **Port conflicts**
   - Check if ports 3001, 10021, 5433, or 6379 are in use
   - Stop other services using these ports

3. **Services not starting**
   - Run: `docker-compose down` then `docker-compose up -d`
   - Check logs: `docker-compose logs -f [service-name]`

4. **Frontend compilation errors**
   - The system will automatically resolve missing dependencies
   - Wait a few minutes for the build to complete

5. **Database connection issues**
   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Restart if needed: `docker-compose restart postgres`

### Useful Commands:

```bash
# Check service status
docker-compose ps

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart specific service
docker-compose restart frontend

# Rebuild specific service
docker-compose build --no-cache frontend

# Clean restart (removes all data)
docker-compose down -v && docker-compose up -d
```

## 🔍 Service Health Checks

You can verify services are running properly:

- **Frontend**: Visit http://localhost:10021 - should show the main page
- **Backend**: Visit http://localhost:3001/health - should return OK
- **Database**: Check `docker-compose ps` - postgres should show "healthy"
- **Redis**: Check `docker-compose ps` - redis should show "healthy"

## 📁 Project Structure

```
kondon/
├── frontend/          # React/Next.js frontend
├── backend/           # Node.js/Express backend
├── dashboard-frontend/# Admin dashboard (React)
├── dashboard-backend/ # Admin API (Python/FastAPI)
├── services/          # Additional microservices
├── docker-compose.yml # Docker orchestration
├── start.bat         # Windows start script
├── stop.bat          # Windows stop script
└── README.md         # This file
```

## 🚦 Development

### Making Changes:
1. Make your code changes in the respective directories
2. For frontend changes: The development server will auto-reload
3. For backend changes: The development server will auto-restart
4. For major changes: Rebuild the container
   ```bash
   docker-compose build [service-name]
   docker-compose up -d [service-name]
   ```

### Database Changes:
- Database schema and seed data are automatically applied on startup
- For clean database: `docker-compose down -v && docker-compose up -d`

## 📊 Monitoring

- **Application Logs**: `docker-compose logs -f`
- **Prometheus Metrics**: http://localhost:9090 (if enabled)
- **Database**: Connect using any PostgreSQL client to `localhost:5433`

## 🔐 Security Notes

- This setup is for development only
- Default passwords are used - change them for production
- All services are accessible on localhost only

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify Docker Desktop is running and healthy
3. Check service logs for error messages
4. Try a clean restart with `stop.bat` then `start.bat`

## 📝 Additional Notes

- **First startup** may take 5-10 minutes as Docker downloads and builds images
- **Subsequent startups** are much faster (30-60 seconds)
- The system uses **hot reloading** for development - changes are reflected immediately
- All data is persisted in Docker volumes and will survive container restarts

---

*Happy coding! 🎉*