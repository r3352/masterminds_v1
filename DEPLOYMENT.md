# 🚀 Masterminds Q&A Platform Deployment Guide

This guide covers deploying the Masterminds Q&A Platform using Docker and Docker Compose.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** for cloning the repository
- **Node.js 18+** (for local development)

### Installing Docker

#### Windows
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Follow the installation wizard
- Restart your computer if prompted

#### macOS
- Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Drag to Applications folder and launch

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

## 🏗️ Architecture Overview

The application consists of:

- **Frontend**: Next.js 14 with React 18
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL 16 with pgvector extension
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx (production only)

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd masterminds-platform
```

### 2. Development Deployment
```bash
# Using deploy script (recommended)
./deploy.sh

# Or using Docker Compose directly
docker-compose up -d
```

### 3. Production Deployment
```bash
# Copy and configure environment file
cp .env.prod.example .env.prod
# Edit .env.prod with your production values

# Deploy with build option
./deploy.sh --prod --build --migrate
```

## 🔧 Configuration

### Environment Variables

#### Development (.env)
The development environment uses default values. Optionally create a `.env` file:
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/masterminds
REDIS_URL=redis://redis:6379
JWT_SECRET=dev-secret-key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
OPENAI_API_KEY=your-openai-api-key
```

#### Production (.env.prod)
**Required for production deployment:**
```env
# Database
DB_PASSWORD=your-secure-database-password

# JWT Configuration (use strong, unique keys)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-64-characters-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-at-least-64-characters-long

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs (update with your domain)
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_WS_URL=wss://yourdomain.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## 📦 Deployment Options

### Using Deployment Scripts

#### Linux/macOS
```bash
# Development
./deploy.sh

# Production
./deploy.sh --prod --build

# With database migrations
./deploy.sh --migrate

# Show help
./deploy.sh --help
```

#### Windows
```batch
REM Development
deploy.bat

REM Production
deploy.bat --prod --build

REM With database migrations
deploy.bat --migrate

REM Show help
deploy.bat --help
```

### Using Docker Compose Directly

#### Development
```bash
# Start services
docker-compose up -d

# With rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Production
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# With rebuild
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 🗄️ Database Management

### Running Migrations
```bash
# Development
docker-compose exec backend npm run migration:run

# Production
docker-compose -f docker-compose.prod.yml exec backend npm run migration:run
```

### Seeding Data
```bash
# Development only
docker-compose exec backend npm run seed
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d masterminds

# Redis CLI
docker-compose exec redis redis-cli
```

### Backup and Restore
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres masterminds > backup.sql

# Restore database
docker-compose exec postgres psql -U postgres -d masterminds < backup.sql
```

## 🌐 Service URLs

### Development
- **Frontend**: http://localhost:10021
- **Backend API**: http://localhost:3001/api
- **GraphQL Playground**: http://localhost:3001/graphql
- **WebSocket**: ws://localhost:3001/live
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Production
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost/api
- **GraphQL Playground**: http://localhost/graphql
- **WebSocket**: ws://localhost/live
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔍 Monitoring and Troubleshooting

### Health Checks
```bash
# Check all services status
docker-compose ps

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis

# Check service health
curl http://localhost:3001/api/health
```

### Common Issues

#### 1. Port Conflicts
If ports 3001, 10021, 5432, or 6379 are in use:
```bash
# Stop conflicting services
sudo lsof -ti:3001 | xargs kill -9
sudo lsof -ti:5432 | xargs kill -9
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### 3. Frontend Build Issues
```bash
# Rebuild frontend
docker-compose build frontend --no-cache
docker-compose up -d frontend
```

#### 4. Permission Issues (Linux/macOS)
```bash
# Fix Docker permissions
sudo chown -R $USER:$USER ~/.docker
sudo chmod -R 755 ~/.docker
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use strong, unique passwords for all services
- [ ] Configure proper firewall rules
- [ ] Enable HTTPS with SSL certificates
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Enable database SSL
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup strategy in place

### SSL/HTTPS Setup
For production, you should:
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Configure Nginx for HTTPS
3. Update environment URLs to use `https://` and `wss://`

## 📊 Performance Optimization

### Production Optimizations

#### Database
- Enable connection pooling
- Configure proper indexes
- Set up read replicas if needed
- Regular VACUUM and ANALYZE

#### Redis
- Configure memory limits
- Set up persistence
- Monitor memory usage

#### Docker
- Use multi-stage builds
- Optimize image layers
- Set memory and CPU limits

#### Nginx
- Enable gzip compression
- Configure caching headers
- Set up rate limiting

## 🚀 Scaling Considerations

### Horizontal Scaling
- Load balance multiple backend instances
- Use Redis for session storage
- Set up database read replicas
- Implement CDN for static assets

### Monitoring Stack
Consider adding:
- **Prometheus** for metrics
- **Grafana** for dashboards
- **ELK Stack** for logging
- **Sentry** for error tracking

## 📝 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backups scheduled
- [ ] Monitoring set up
- [ ] DNS configured

### Deployment
- [ ] Build and test locally
- [ ] Run migrations
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify all services

### Post-deployment
- [ ] Monitor logs for errors
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Update documentation
- [ ] Notify stakeholders

## 🆘 Support and Troubleshooting

### Getting Help
1. Check the logs: `docker-compose logs -f`
2. Verify service health: `docker-compose ps`
3. Check network connectivity between services
4. Verify environment variables are set correctly
5. Ensure all required ports are available

### Useful Commands
```bash
# Restart all services
docker-compose restart

# Rebuild and restart specific service
docker-compose up -d --build backend

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres bash

# Clean up everything (destructive)
docker-compose down -v --rmi all
docker system prune -a

# Monitor resource usage
docker stats
```

---

For additional help or questions, please refer to the main README.md or create an issue in the repository.