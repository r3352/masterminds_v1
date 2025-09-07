# Comprehensive Production-Ready Claude Code Prompt for Kondon Platform

## Project Context
You are working on the Kondon Q&A platform at `C:\Users\admin\Documents\kondon`. The application has working authentication and GraphQL, but needs critical production-ready features and fixes before deployment.

## Critical Issues Identified
1. **Port Configuration Mismatch**: Backend exposed on 3005 but frontend expects 3001
2. **Zero Test Coverage**: No tests exist
3. **Missing Health Checks**: Docker expects health endpoints that don't exist
4. **Security Vulnerabilities**: No rate limiting, security headers, or input sanitization
5. **No Error Handling/Logging**: Missing centralized error handling and logging
6. **Database Issues**: No migrations or seed data
7. **Missing Documentation**: No API docs or code documentation
8. **Performance Issues**: No caching, N+1 queries, missing optimization
9. **No CI/CD Pipeline**: Missing automated testing and deployment
10. **Missing Monitoring**: No APM, error tracking, or metrics

## Sub-Agent Task Distribution

### Sub-Agent 1: Infrastructure & Configuration Fixer
**Role**: Fix all configuration issues and setup proper infrastructure

**Tasks**:

1. **Fix Port Configuration Mismatch**
   ```typescript
   // frontend/.env.local - UPDATE
   NEXT_PUBLIC_API_URL=http://localhost:3005
   NEXT_PUBLIC_WS_URL=ws://localhost:3005
   
   // OR fix docker-compose.yml to use 3001:3001
   backend:
     ports:
       - "3001:3001"
   ```

2. **Create Health Check Endpoints**
   ```typescript
   // backend/src/health/health.controller.ts
   import { Controller, Get } from '@nestjs/common';
   import { Public } from '@/auth/decorators/public.decorator';
   import { InjectConnection } from '@nestjs/typeorm';
   import { Connection } from 'typeorm';
   import Redis from 'redis';
   
   @Controller('health')
   export class HealthController {
     constructor(
       @InjectConnection() private connection: Connection,
       private redis: Redis
     ) {}
     
     @Public()
     @Get()
     async check() {
       const checks = {
         status: 'healthy',
         timestamp: new Date().toISOString(),
         uptime: process.uptime(),
         services: {
           database: 'checking',
           redis: 'checking',
           memory: 'checking'
         }
       };
       
       // Check database
       try {
         await this.connection.query('SELECT 1');
         checks.services.database = 'healthy';
       } catch (error) {
         checks.services.database = 'unhealthy';
         checks.status = 'unhealthy';
       }
       
       // Check Redis
       try {
         await this.redis.ping();
         checks.services.redis = 'healthy';
       } catch (error) {
         checks.services.redis = 'unhealthy';
         checks.status = 'unhealthy';
       }
       
       // Check memory usage
       const memUsage = process.memoryUsage();
       const memLimit = 1024 * 1024 * 1024; // 1GB
       checks.services.memory = memUsage.heapUsed < memLimit ? 'healthy' : 'warning';
       
       return checks;
     }
     
     @Public()
     @Get('live')
     async liveness() {
       return { status: 'alive', timestamp: new Date().toISOString() };
     }
     
     @Public()
     @Get('ready')
     async readiness() {
       // Check if app is ready to receive traffic
       const isReady = await this.checkReadiness();
       if (!isReady) {
         throw new ServiceUnavailableException('Service not ready');
       }
       return { status: 'ready', timestamp: new Date().toISOString() };
     }
   }
   ```

3. **Setup Environment Configuration**
   ```typescript
   // backend/src/config/configuration.ts
   export default () => ({
     app: {
       port: parseInt(process.env.PORT, 10) || 3001,
       environment: process.env.NODE_ENV || 'development',
       name: 'Kondon Platform',
       version: process.env.npm_package_version || '1.0.0',
     },
     database: {
       url: process.env.DATABASE_URL,
       host: process.env.DB_HOST || 'localhost',
       port: parseInt(process.env.DB_PORT, 10) || 5432,
       username: process.env.DB_USERNAME || 'postgres',
       password: process.env.DB_PASSWORD || 'postgres',
       database: process.env.DB_NAME || 'masterminds',
       ssl: process.env.NODE_ENV === 'production',
       poolSize: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
     },
     redis: {
       url: process.env.REDIS_URL || 'redis://localhost:6379',
       ttl: parseInt(process.env.CACHE_TTL, 10) || 3600,
     },
     jwt: {
       secret: process.env.JWT_SECRET,
       refreshSecret: process.env.JWT_REFRESH_SECRET,
       expiresIn: process.env.JWT_EXPIRES_IN || '15m',
       refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
     },
     security: {
       bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
       rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
       rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
     },
     monitoring: {
       sentryDsn: process.env.SENTRY_DSN,
       logLevel: process.env.LOG_LEVEL || 'info',
     }
   });
   ```

4. **Create Docker Health Check Script**
   ```bash
   # scripts/healthcheck.sh
   #!/bin/bash
   
   # Check backend health
   curl -f http://localhost:3001/health || exit 1
   
   # Check frontend
   curl -f http://localhost:10021 || exit 1
   
   # Check database
   pg_isready -h localhost -p 5432 || exit 1
   
   # Check Redis
   redis-cli ping || exit 1
   
   echo "All services healthy"
   exit 0
   ```

### Sub-Agent 2: Security & Error Handling Expert
**Role**: Implement comprehensive security measures and error handling

**Tasks**:

1. **Implement Rate Limiting**
   ```typescript
   // backend/src/app.module.ts - ADD to imports
   import { ThrottlerModule } from '@nestjs/throttler';
   
   @Module({
     imports: [
       ThrottlerModule.forRoot({
         ttl: 60,
         limit: 100,
       }),
       // ... other imports
     ]
   })
   
   // backend/src/common/guards/throttler-behind-proxy.guard.ts
   import { ThrottlerGuard } from '@nestjs/throttler';
   import { Injectable } from '@nestjs/common';
   
   @Injectable()
   export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
     protected getTracker(req: Record<string, any>): string {
       return req.ips.length ? req.ips[0] : req.ip;
     }
   }
   ```

2. **Add Security Headers Middleware**
   ```typescript
   // backend/src/middleware/security.middleware.ts
   import { Injectable, NestMiddleware } from '@nestjs/common';
   import helmet from 'helmet';
   
   @Injectable()
   export class SecurityMiddleware implements NestMiddleware {
     use(req: any, res: any, next: () => void) {
       // Apply helmet for security headers
       helmet({
         contentSecurityPolicy: {
           directives: {
             defaultSrc: ["'self'"],
             styleSrc: ["'self'", "'unsafe-inline'"],
             scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
             imgSrc: ["'self'", "data:", "https:"],
           },
         },
         hsts: {
           maxAge: 31536000,
           includeSubDomains: true,
           preload: true,
         },
       })(req, res, next);
     }
   }
   ```

3. **Implement Centralized Error Handler**
   ```typescript
   // backend/src/common/filters/all-exceptions.filter.ts
   import {
     ExceptionFilter,
     Catch,
     ArgumentsHost,
     HttpException,
     HttpStatus,
     Logger,
   } from '@nestjs/common';
   import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
   import * as Sentry from '@sentry/node';
   
   @Catch()
   export class AllExceptionsFilter implements ExceptionFilter, GqlExceptionFilter {
     private readonly logger = new Logger(AllExceptionsFilter.name);
     
     catch(exception: unknown, host: ArgumentsHost) {
       const gqlHost = GqlArgumentsHost.create(host);
       const ctx = host.switchToHttp();
       const response = ctx.getResponse();
       const request = ctx.getRequest();
       
       let status = HttpStatus.INTERNAL_SERVER_ERROR;
       let message = 'Internal server error';
       let details = null;
       
       if (exception instanceof HttpException) {
         status = exception.getStatus();
         const errorResponse = exception.getResponse();
         message = errorResponse['message'] || exception.message;
         details = errorResponse['error'] || null;
       } else if (exception instanceof Error) {
         message = exception.message;
         
         // Log to Sentry in production
         if (process.env.NODE_ENV === 'production') {
           Sentry.captureException(exception);
         }
       }
       
       // Log error
       this.logger.error(
         `Error: ${message}`,
         exception instanceof Error ? exception.stack : '',
         {
           url: request?.url,
           method: request?.method,
           ip: request?.ip,
           userId: request?.user?.id,
         }
       );
       
       // Return error response
       if (response && response.status) {
         response.status(status).json({
           statusCode: status,
           timestamp: new Date().toISOString(),
           path: request.url,
           message,
           details,
         });
       } else {
         // GraphQL error
         return {
           message,
           statusCode: status,
           timestamp: new Date().toISOString(),
           details,
         };
       }
     }
   }
   ```

4. **Add Input Sanitization**
   ```typescript
   // backend/src/common/pipes/sanitize.pipe.ts
   import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
   import DOMPurify from 'isomorphic-dompurify';
   import { escape } from 'lodash';
   
   @Injectable()
   export class SanitizePipe implements PipeTransform {
     transform(value: any) {
       if (typeof value === 'string') {
         // Remove any potential XSS
         const cleaned = DOMPurify.sanitize(value, { 
           ALLOWED_TAGS: [],
           ALLOWED_ATTR: [] 
         });
         
         // Escape SQL characters
         const escaped = escape(cleaned);
         
         // Check for SQL injection patterns
         const sqlPatterns = [
           /(\b(DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/gi,
           /(--)/g,
           /(\*|;)/g,
         ];
         
         for (const pattern of sqlPatterns) {
           if (pattern.test(escaped)) {
             throw new BadRequestException('Invalid input detected');
           }
         }
         
         return escaped;
       }
       
       if (typeof value === 'object' && value !== null) {
         for (const key in value) {
           value[key] = this.transform(value[key]);
         }
       }
       
       return value;
     }
   }
   ```

### Sub-Agent 3: Testing Infrastructure Creator
**Role**: Create comprehensive test suites for backend and frontend

**Tasks**:

1. **Backend Unit Tests**
   ```typescript
   // backend/src/auth/auth.service.spec.ts
   import { Test, TestingModule } from '@nestjs/testing';
   import { AuthService } from './auth.service';
   import { UsersService } from '../users/users.service';
   import { JwtService } from '@nestjs/jwt';
   import * as bcrypt from 'bcrypt';
   
   describe('AuthService', () => {
     let service: AuthService;
     let usersService: UsersService;
     let jwtService: JwtService;
     
     const mockUser = {
       id: '1',
       email: 'test@example.com',
       username: 'testuser',
       password_hash: 'hashedpassword',
     };
     
     beforeEach(async () => {
       const module: TestingModule = await Test.createTestingModule({
         providers: [
           AuthService,
           {
             provide: UsersService,
             useValue: {
               findByEmail: jest.fn(),
               findByUsername: jest.fn(),
               create: jest.fn(),
             },
           },
           {
             provide: JwtService,
             useValue: {
               sign: jest.fn(),
               verify: jest.fn(),
             },
           },
         ],
       }).compile();
       
       service = module.get<AuthService>(AuthService);
       usersService = module.get<UsersService>(UsersService);
       jwtService = module.get<JwtService>(JwtService);
     });
     
     describe('register', () => {
       it('should create a new user and return tokens', async () => {
         const createUserDto = {
           email: 'new@example.com',
           username: 'newuser',
           password: 'password123',
         };
         
         jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
         jest.spyOn(usersService, 'findByUsername').mockResolvedValue(null);
         jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword');
         jest.spyOn(usersService, 'create').mockResolvedValue(mockUser);
         jest.spyOn(jwtService, 'sign')
           .mockReturnValueOnce('access_token')
           .mockReturnValueOnce('refresh_token');
         
         const result = await service.register(createUserDto);
         
         expect(result).toHaveProperty('access_token');
         expect(result).toHaveProperty('refresh_token');
         expect(result).toHaveProperty('user');
         expect(usersService.create).toHaveBeenCalled();
       });
       
       it('should throw error if email already exists', async () => {
         jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
         
         await expect(service.register({
           email: 'test@example.com',
           username: 'newuser',
           password: 'password123',
         })).rejects.toThrow('Email already exists');
       });
     });
     
     describe('login', () => {
       it('should validate user and return tokens', async () => {
         jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
         jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
         jest.spyOn(jwtService, 'sign')
           .mockReturnValueOnce('access_token')
           .mockReturnValueOnce('refresh_token');
         
         const result = await service.login({
           identifier: 'test@example.com',
           password: 'password123',
         });
         
         expect(result).toHaveProperty('access_token');
         expect(result).toHaveProperty('refresh_token');
       });
       
       it('should throw error for invalid credentials', async () => {
         jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
         jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
         
         await expect(service.login({
           identifier: 'test@example.com',
           password: 'wrongpassword',
         })).rejects.toThrow('Invalid credentials');
       });
     });
   });
   ```

2. **Frontend Component Tests**
   ```typescript
   // frontend/src/app/auth/login/login.test.tsx
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import { MockedProvider } from '@apollo/client/testing';
   import LoginPage from './page';
   import { LOGIN_MUTATION } from '@/lib/graphql/auth';
   
   const mocks = [
     {
       request: {
         query: LOGIN_MUTATION,
         variables: {
           input: {
             identifier: 'test@example.com',
             password: 'password123',
           },
         },
       },
       result: {
         data: {
           login: {
             access_token: 'token',
             refresh_token: 'refresh',
             user: {
               id: '1',
               email: 'test@example.com',
               username: 'testuser',
             },
           },
         },
       },
     },
   ];
   
   describe('LoginPage', () => {
     it('should render login form', () => {
       render(
         <MockedProvider mocks={mocks}>
           <LoginPage />
         </MockedProvider>
       );
       
       expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
       expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
       expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
     });
     
     it('should handle successful login', async () => {
       render(
         <MockedProvider mocks={mocks}>
           <LoginPage />
         </MockedProvider>
       );
       
       const emailInput = screen.getByLabelText(/email/i);
       const passwordInput = screen.getByLabelText(/password/i);
       const submitButton = screen.getByRole('button', { name: /login/i });
       
       fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
       fireEvent.change(passwordInput, { target: { value: 'password123' } });
       fireEvent.click(submitButton);
       
       await waitFor(() => {
         expect(localStorage.getItem('access_token')).toBe('token');
       });
     });
   });
   ```

3. **E2E Tests**
   ```typescript
   // e2e/auth.e2e.spec.ts
   import { test, expect } from '@playwright/test';
   
   test.describe('Authentication Flow', () => {
     test('should register new user', async ({ page }) => {
       await page.goto('http://localhost:10021/auth/register');
       
       // Fill registration form
       await page.fill('input[name="email"]', 'e2e@test.com');
       await page.fill('input[name="username"]', 'e2euser');
       await page.fill('input[name="password"]', 'E2EPassword123!');
       await page.fill('input[name="fullName"]', 'E2E Test User');
       
       // Submit form
       await page.click('button[type="submit"]');
       
       // Should redirect to dashboard
       await expect(page).toHaveURL(/.*dashboard/);
       
       // User info should be visible
       await expect(page.locator('[data-testid="user-info"]')).toContainText('e2euser');
     });
     
     test('should login existing user', async ({ page }) => {
       await page.goto('http://localhost:10021/auth/login');
       
       await page.fill('input[name="identifier"]', 'wskondon@gmail.com');
       await page.fill('input[name="password"]', 'Password123!');
       
       await page.click('button[type="submit"]');
       
       await expect(page).toHaveURL(/.*dashboard/);
     });
     
     test('should protect routes', async ({ page }) => {
       // Clear any existing auth
       await page.goto('http://localhost:10021');
       await page.evaluate(() => localStorage.clear());
       
       // Try to access protected route
       await page.goto('http://localhost:10021/dashboard');
       
       // Should redirect to login
       await expect(page).toHaveURL(/.*auth\/login/);
     });
   });
   ```

4. **Test Configuration**
   ```json
   // package.json scripts addition
   {
     "scripts": {
       "test": "jest",
       "test:watch": "jest --watch",
       "test:cov": "jest --coverage",
       "test:e2e": "playwright test",
       "test:all": "npm run test && npm run test:e2e"
     }
   }
   
   // jest.config.js
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'node',
     roots: ['<rootDir>/src'],
     testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
     collectCoverageFrom: [
       'src/**/*.ts',
       '!src/**/*.d.ts',
       '!src/**/*.interface.ts',
       '!src/**/*.module.ts',
     ],
     coverageThreshold: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80,
       },
     },
   };
   ```

### Sub-Agent 4: Database & Performance Optimizer
**Role**: Optimize database, implement caching, and fix performance issues

**Tasks**:

1. **Create Database Migrations**
   ```typescript
   // backend/migrations/1700000000000-InitialSchema.ts
   import { MigrationInterface, QueryRunner } from 'typeorm';
   
   export class InitialSchema1700000000000 implements MigrationInterface {
     public async up(queryRunner: QueryRunner): Promise<void> {
       // Create extensions
       await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
       await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);
       
       // Create users table with indexes
       await queryRunner.query(`
         CREATE TABLE "users" (
           "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
           "email" VARCHAR(255) UNIQUE NOT NULL,
           "username" VARCHAR(50) UNIQUE NOT NULL,
           "password_hash" VARCHAR(255) NOT NULL,
           "full_name" VARCHAR(255),
           "avatar_url" VARCHAR(500),
           "bio" TEXT,
           "reputation_score" INTEGER DEFAULT 0,
           "is_active" BOOLEAN DEFAULT true,
           "email_verified" BOOLEAN DEFAULT false,
           "two_factor_enabled" BOOLEAN DEFAULT false,
           "two_factor_secret" VARCHAR(255),
           "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
       `);
       
       // Create indexes for performance
       await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);
       await queryRunner.query(`CREATE INDEX idx_users_username ON users(username)`);
       await queryRunner.query(`CREATE INDEX idx_users_reputation ON users(reputation_score DESC)`);
       
       // Create questions table
       await queryRunner.query(`
         CREATE TABLE "questions" (
           "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
           "title" VARCHAR(500) NOT NULL,
           "content" TEXT NOT NULL,
           "content_vector" vector(1536),
           "author_id" UUID REFERENCES users(id) ON DELETE CASCADE,
           "tags" TEXT[],
           "status" VARCHAR(50) DEFAULT 'open',
           "bounty_amount" INTEGER DEFAULT 0,
           "is_urgent" BOOLEAN DEFAULT false,
           "priority_level" INTEGER DEFAULT 0,
           "view_count" INTEGER DEFAULT 0,
           "upvotes" INTEGER DEFAULT 0,
           "downvotes" INTEGER DEFAULT 0,
           "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
         )
       `);
       
       // Performance indexes
       await queryRunner.query(`CREATE INDEX idx_questions_author ON questions(author_id)`);
       await queryRunner.query(`CREATE INDEX idx_questions_status ON questions(status)`);
       await queryRunner.query(`CREATE INDEX idx_questions_created ON questions(created_at DESC)`);
       await queryRunner.query(`CREATE INDEX idx_questions_tags ON questions USING GIN(tags)`);
       await queryRunner.query(`CREATE INDEX idx_questions_vector ON questions USING ivfflat (content_vector vector_cosine_ops)`);
       
       // Add more tables...
     }
     
     public async down(queryRunner: QueryRunner): Promise<void> {
       await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);
       await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
     }
   }
   ```

2. **Implement DataLoader for N+1 Prevention**
   ```typescript
   // backend/src/common/dataloaders/user.dataloader.ts
   import DataLoader from 'dataloader';
   import { Injectable, Scope } from '@nestjs/common';
   import { UsersService } from '@/users/users.service';
   
   @Injectable({ scope: Scope.REQUEST })
   export class UserDataLoader {
     constructor(private usersService: UsersService) {}
     
     public readonly batchUsers = new DataLoader(async (userIds: string[]) => {
       const users = await this.usersService.findByIds(userIds);
       const userMap = new Map(users.map(user => [user.id, user]));
       return userIds.map(id => userMap.get(id));
     });
   }
   
   // backend/src/questions/questions.resolver.ts - USE DataLoader
   @ResolveField(() => User)
   async author(@Parent() question: Question, @Context('userLoader') userLoader: UserDataLoader) {
     return userLoader.batchUsers.load(question.author_id);
   }
   ```

3. **Implement Redis Caching**
   ```typescript
   // backend/src/common/decorators/cache.decorator.ts
   import { SetMetadata } from '@nestjs/common';
   
   export const CACHE_KEY_METADATA = 'cache_key';
   export const CACHE_TTL_METADATA = 'cache_ttl';
   
   export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);
   export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);
   
   // backend/src/common/interceptors/cache.interceptor.ts
   import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
   import { Observable, of } from 'rxjs';
   import { tap } from 'rxjs/operators';
   import { Cache } from 'cache-manager';
   import { Reflector } from '@nestjs/core';
   
   @Injectable()
   export class CacheInterceptor implements NestInterceptor {
     constructor(
       private cache: Cache,
       private reflector: Reflector,
     ) {}
     
     async intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
       const key = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
       const ttl = this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) || 3600;
       
       if (!key) {
         return next.handle();
       }
       
       try {
         const cached = await this.cache.get(key);
         if (cached) {
           return of(cached);
         }
       } catch (error) {
         // Log error but continue without cache
       }
       
       return next.handle().pipe(
         tap(data => {
           this.cache.set(key, data, ttl);
         }),
       );
     }
   }
   
   // Usage in resolver
   @Query(() => [Question])
   @CacheKey('trending_questions')
   @CacheTTL(300) // 5 minutes
   async trendingQuestions() {
     return this.questionsService.getTrending();
   }
   ```

4. **Database Query Optimization**
   ```typescript
   // backend/src/questions/questions.service.ts
   async findWithOptimization(filters: QuestionFilterDto) {
     const query = this.questionRepository
       .createQueryBuilder('question')
       .leftJoinAndSelect('question.author', 'author')
       .leftJoinAndSelect('question.answers', 'answers')
       .leftJoinAndSelect('answers.author', 'answerAuthor')
       .select([
         'question.id',
         'question.title',
         'question.content',
         'question.created_at',
         'question.tags',
         'question.status',
         'author.id',
         'author.username',
         'author.avatar_url',
         'answers.id',
         'answers.content',
         'answerAuthor.username'
       ]);
     
     // Add filters
     if (filters.status) {
       query.andWhere('question.status = :status', { status: filters.status });
     }
     
     if (filters.tags?.length) {
       query.andWhere('question.tags && :tags', { tags: filters.tags });
     }
     
     // Use proper pagination
     query
       .skip(filters.skip || 0)
       .take(filters.take || 20)
       .orderBy('question.created_at', 'DESC');
     
     // Get total count separately for performance
     const [items, total] = await query.getManyAndCount();
     
     return {
       items,
       total,
       hasMore: (filters.skip || 0) + items.length < total,
     };
   }
   ```

### Sub-Agent 5: CI/CD & Deployment Pipeline Creator
**Role**: Setup automated testing, building, and deployment

**Tasks**:

1. **GitHub Actions CI/CD**
   ```yaml
   # .github/workflows/ci-cd.yml
   name: CI/CD Pipeline
   
   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main]
   
   env:
     NODE_VERSION: '18'
     DOCKER_REGISTRY: ghcr.io
   
   jobs:
     test-backend:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:16
           env:
             POSTGRES_PASSWORD: postgres
           options: >-
             --health-cmd pg_isready
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
         redis:
           image: redis:7
           options: >-
             --health-cmd "redis-cli ping"
             --health-interval 10s
             --health-timeout 5s
             --health-retries 5
       
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: ${{ env.NODE_VERSION }}
             cache: 'npm'
             cache-dependency-path: backend/package-lock.json
         
         - name: Install dependencies
           run: |
             cd backend
             npm ci
         
         - name: Run linting
           run: |
             cd backend
             npm run lint
         
         - name: Run tests
           run: |
             cd backend
             npm run test:cov
           env:
             DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
             REDIS_URL: redis://localhost:6379
             JWT_SECRET: test-secret
         
         - name: Upload coverage
           uses: codecov/codecov-action@v3
           with:
             files: ./backend/coverage/lcov.info
             flags: backend
   
     test-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: ${{ env.NODE_VERSION }}
             cache: 'npm'
             cache-dependency-path: frontend/package-lock.json
         
         - name: Install dependencies
           run: |
             cd frontend
             npm ci
         
         - name: Run linting
           run: |
             cd frontend
             npm run lint
         
         - name: Run tests
           run: |
             cd frontend
             npm run test:cov
         
         - name: Build frontend
           run: |
             cd frontend
             npm run build
   
     e2e-tests:
       needs: [test-backend, test-frontend]
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Start services
           run: |
             docker-compose up -d
             sleep 30 # Wait for services to be ready
         
         - name: Run E2E tests
           run: |
             npx playwright test
         
         - name: Upload test results
           if: always()
           uses: actions/upload-artifact@v3
           with:
             name: playwright-report
             path: playwright-report/
   
     build-and-push:
       needs: [e2e-tests]
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       
       steps:
         - uses: actions/checkout@v3
         
         - name: Set up Docker Buildx
           uses: docker/setup-buildx-action@v2
         
         - name: Log in to GitHub Container Registry
           uses: docker/login-action@v2
           with:
             registry: ${{ env.DOCKER_REGISTRY }}
             username: ${{ github.actor }}
             password: ${{ secrets.GITHUB_TOKEN }}
         
         - name: Build and push Backend
           uses: docker/build-push-action@v4
           with:
             context: ./backend
             push: true
             tags: |
               ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/backend:latest
               ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/backend:${{ github.sha }}
             cache-from: type=gha
             cache-to: type=gha,mode=max
         
         - name: Build and push Frontend
           uses: docker/build-push-action@v4
           with:
             context: ./frontend
             push: true
             tags: |
               ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/frontend:latest
               ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/frontend:${{ github.sha }}
             cache-from: type=gha
             cache-to: type=gha,mode=max
   
     deploy:
       needs: [build-and-push]
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       
       steps:
         - name: Deploy to production
           run: |
             echo "Deploy to production server"
             # Add deployment commands (SSH, Kubernetes, etc.)
   ```

2. **Docker Production Build**
   ```dockerfile
   # backend/Dockerfile.prod
   FROM node:18-alpine AS builder
   
   WORKDIR /app
   
   # Copy package files
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy source
   COPY . .
   
   # Build
   RUN npm run build
   
   # Production stage
   FROM node:18-alpine
   
   RUN apk add --no-cache tini
   
   WORKDIR /app
   
   # Copy built application
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package*.json ./
   
   # Create non-root user
   RUN addgroup -g 1001 -S nodejs && \
       adduser -S nodejs -u 1001
   
   USER nodejs
   
   EXPOSE 3001
   
   ENTRYPOINT ["/sbin/tini", "--"]
   CMD ["node", "dist/main.js"]
   ```

3. **Kubernetes Deployment**
   ```yaml
   # k8s/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: kondon-backend
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: kondon-backend
     template:
       metadata:
         labels:
           app: kondon-backend
       spec:
         containers:
         - name: backend
           image: ghcr.io/yourorg/kondon/backend:latest
           ports:
           - containerPort: 3001
           env:
           - name: DATABASE_URL
             valueFrom:
               secretKeyRef:
                 name: kondon-secrets
                 key: database-url
           - name: REDIS_URL
             valueFrom:
               secretKeyRef:
                 name: kondon-secrets
                 key: redis-url
           livenessProbe:
             httpGet:
               path: /health/live
               port: 3001
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /health/ready
               port: 3001
             initialDelaySeconds: 5
             periodSeconds: 5
           resources:
             requests:
               memory: "256Mi"
               cpu: "250m"
             limits:
               memory: "512Mi"
               cpu: "500m"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: kondon-backend
   spec:
     selector:
       app: kondon-backend
     ports:
     - port: 3001
       targetPort: 3001
     type: ClusterIP
   ```

### Sub-Agent 6: Monitoring & Observability Expert
**Role**: Setup comprehensive monitoring, logging, and alerting

**Tasks**:

1. **Setup Logging System**
   ```typescript
   // backend/src/common/logger/logger.service.ts
   import { Injectable, LoggerService } from '@nestjs/common';
   import * as winston from 'winston';
   import * as Sentry from '@sentry/node';
   
   @Injectable()
   export class CustomLogger implements LoggerService {
     private logger: winston.Logger;
     
     constructor() {
       const logFormat = winston.format.combine(
         winston.format.timestamp(),
         winston.format.errors({ stack: true }),
         winston.format.json(),
       );
       
       this.logger = winston.createLogger({
         level: process.env.LOG_LEVEL || 'info',
         format: logFormat,
         defaultMeta: { 
           service: 'kondon-backend',
           environment: process.env.NODE_ENV,
         },
         transports: [
           // Console transport
           new winston.transports.Console({
             format: winston.format.combine(
               winston.format.colorize(),
               winston.format.simple(),
             ),
           }),
           // File transport for errors
           new winston.transports.File({
             filename: 'logs/error.log',
             level: 'error',
           }),
           // File transport for all logs
           new winston.transports.File({
             filename: 'logs/combined.log',
           }),
         ],
       });
       
       // Add Sentry transport in production
       if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
         Sentry.init({
           dsn: process.env.SENTRY_DSN,
           environment: process.env.NODE_ENV,
           tracesSampleRate: 0.1,
         });
       }
     }
     
     log(message: string, context?: string) {
       this.logger.info(message, { context });
     }
     
     error(message: string, trace?: string, context?: string) {
       this.logger.error(message, { trace, context });
       
       if (process.env.NODE_ENV === 'production') {
         Sentry.captureException(new Error(message));
       }
     }
     
     warn(message: string, context?: string) {
       this.logger.warn(message, { context });
     }
     
     debug(message: string, context?: string) {
       this.logger.debug(message, { context });
     }
     
     verbose(message: string, context?: string) {
       this.logger.verbose(message, { context });
     }
   }
   ```

2. **Setup Prometheus Metrics**
   ```typescript
   // backend/src/common/metrics/metrics.service.ts
   import { Injectable } from '@nestjs/common';
   import { register, Counter, Histogram, Gauge } from 'prom-client';
   
   @Injectable()
   export class MetricsService {
     private httpRequestDuration: Histogram<string>;
     private httpRequestTotal: Counter<string>;
     private activeConnections: Gauge<string>;
     private dbQueryDuration: Histogram<string>;
     private cacheHitRate: Counter<string>;
     
     constructor() {
       // HTTP metrics
       this.httpRequestDuration = new Histogram({
         name: 'http_request_duration_seconds',
         help: 'Duration of HTTP requests in seconds',
         labelNames: ['method', 'route', 'status'],
         buckets: [0.1, 0.5, 1, 2, 5],
       });
       
       this.httpRequestTotal = new Counter({
         name: 'http_requests_total',
         help: 'Total number of HTTP requests',
         labelNames: ['method', 'route', 'status'],
       });
       
       // Database metrics
       this.dbQueryDuration = new Histogram({
         name: 'db_query_duration_seconds',
         help: 'Duration of database queries',
         labelNames: ['operation', 'table'],
         buckets: [0.01, 0.05, 0.1, 0.5, 1],
       });
       
       // Cache metrics
       this.cacheHitRate = new Counter({
         name: 'cache_hits_total',
         help: 'Cache hit rate',
         labelNames: ['cache_name', 'hit'],
       });
       
       // Active connections
       this.activeConnections = new Gauge({
         name: 'active_connections',
         help: 'Number of active connections',
         labelNames: ['type'],
       });
       
       // Register all metrics
       register.registerMetric(this.httpRequestDuration);
       register.registerMetric(this.httpRequestTotal);
       register.registerMetric(this.dbQueryDuration);
       register.registerMetric(this.cacheHitRate);
       register.registerMetric(this.activeConnections);
     }
     
     recordHttpRequest(method: string, route: string, status: number, duration: number) {
       this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
       this.httpRequestTotal.inc({ method, route, status: status.toString() });
     }
     
     recordDbQuery(operation: string, table: string, duration: number) {
       this.dbQueryDuration.observe({ operation, table }, duration);
     }
     
     recordCacheHit(cacheName: string, hit: boolean) {
       this.cacheHitRate.inc({ cache_name: cacheName, hit: hit.toString() });
     }
     
     setActiveConnections(type: string, count: number) {
       this.activeConnections.set({ type }, count);
     }
     
     async getMetrics(): Promise<string> {
       return register.metrics();
     }
   }
   
   // backend/src/common/metrics/metrics.controller.ts
   @Controller('metrics')
   export class MetricsController {
     constructor(private metricsService: MetricsService) {}
     
     @Public()
     @Get()
     async getMetrics(): Promise<string> {
       return this.metricsService.getMetrics();
     }
   }
   ```

3. **Setup APM (Application Performance Monitoring)**
   ```typescript
   // backend/src/common/apm/apm.service.ts
   import * as apm from 'elastic-apm-node';
   
   export function initializeAPM() {
     if (process.env.NODE_ENV === 'production' && process.env.ELASTIC_APM_SERVER_URL) {
       apm.start({
         serviceName: 'kondon-backend',
         serverUrl: process.env.ELASTIC_APM_SERVER_URL,
         secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
         environment: process.env.NODE_ENV,
         captureBody: 'all',
         captureHeaders: true,
         transactionSampleRate: 0.1,
         logLevel: 'info',
       });
     }
   }
   
   // Call in main.ts before NestFactory.create
   initializeAPM();
   ```

4. **Setup Alerting Rules**
   ```yaml
   # monitoring/alerts.yml
   groups:
     - name: kondon_alerts
       interval: 30s
       rules:
         - alert: HighErrorRate
           expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
           for: 5m
           labels:
             severity: critical
           annotations:
             summary: "High error rate detected"
             description: "Error rate is above 5% for 5 minutes"
         
         - alert: HighResponseTime
           expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
           for: 5m
           labels:
             severity: warning
           annotations:
             summary: "High response time"
             description: "95th percentile response time is above 2 seconds"
         
         - alert: DatabaseConnectionPoolExhausted
           expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
           for: 5m
           labels:
             severity: critical
           annotations:
             summary: "Database connection pool nearly exhausted"
             description: "More than 80% of database connections are in use"
         
         - alert: HighMemoryUsage
           expr: process_resident_memory_bytes / process_virtual_memory_max_bytes > 0.9
           for: 5m
           labels:
             severity: warning
           annotations:
             summary: "High memory usage"
             description: "Process is using more than 90% of available memory"
   ```

## Final Validation & Production Checklist

```javascript
// scripts/production-readiness-check.js
const chalk = require('chalk');
const { execSync } = require('child_process');

async function runProductionReadinessCheck() {
  console.log(chalk.blue.bold('\n🔍 PRODUCTION READINESS CHECK\n'));
  
  const checks = [
    // Configuration
    { name: 'Environment variables configured', check: checkEnvVars },
    { name: 'Port configuration aligned', check: checkPorts },
    
    // Security
    { name: 'Rate limiting enabled', check: checkRateLimiting },
    { name: 'Security headers configured', check: checkSecurityHeaders },
    { name: 'Input sanitization active', check: checkSanitization },
    { name: 'CORS properly configured', check: checkCORS },
    
    // Testing
    { name: 'Unit tests passing (>80% coverage)', check: checkUnitTests },
    { name: 'E2E tests passing', check: checkE2ETests },
    
    // Performance
    { name: 'Database indexes created', check: checkDatabaseIndexes },
    { name: 'Redis caching enabled', check: checkRedisCache },
    { name: 'DataLoader preventing N+1', check: checkDataLoader },
    
    // Monitoring
    { name: 'Health checks responding', check: checkHealthEndpoints },
    { name: 'Logging configured', check: checkLogging },
    { name: 'Metrics exposed', check: checkMetrics },
    { name: 'Error tracking setup', check: checkErrorTracking },
    
    // Deployment
    { name: 'Docker builds successfully', check: checkDockerBuild },
    { name: 'CI/CD pipeline configured', check: checkCIPipeline },
    { name: 'Database migrations ready', check: checkMigrations },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const check of checks) {
    try {
      await check.check();
      console.log(chalk.green(`✅ ${check.name}`));
      passed++;
    } catch (error) {
      console.log(chalk.red(`❌ ${check.name}`));
      console.log(chalk.gray(`   ${error.message}`));
      failed++;
    }
  }
  
  console.log(chalk.blue.bold('\n📊 RESULTS\n'));
  console.log(chalk.green(`Passed: ${passed}/${checks.length}`));
  console.log(chalk.red(`Failed: ${failed}/${checks.length}`));
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 APPLICATION IS PRODUCTION READY! 🎉\n'));
  } else {
    console.log(chalk.yellow.bold(`\n⚠️  ${failed} issues need to be fixed before production deployment.\n`));
  }
}

// Run the check
runProductionReadinessCheck().catch(console.error);
```

## Usage Instructions for Claude Code

```
Execute this comprehensive production-readiness transformation:

1. Start with Sub-Agent 1:
   - Fix port configuration mismatch
   - Create health check endpoints
   - Setup proper environment configuration

2. Sub-Agent 2:
   - Implement all security measures
   - Add rate limiting, security headers
   - Setup error handling and sanitization

3. Sub-Agent 3:
   - Create complete test suites
   - Achieve >80% code coverage
   - Setup E2E testing with Playwright

4. Sub-Agent 4:
   - Create database migrations
   - Implement caching strategy
   - Optimize queries with DataLoader

5. Sub-Agent 5:
   - Setup CI/CD pipeline
   - Create production Docker builds
   - Configure Kubernetes deployment

6. Sub-Agent 6:
   - Implement comprehensive logging
   - Setup metrics collection
   - Configure monitoring and alerting

After all sub-agents complete their tasks:
- Run the production readiness check
- Fix any remaining issues
- Deploy with confidence

The application should pass all production readiness checks and be ready for deployment.
```

## Expected Outcome

After running this comprehensive prompt, your Kondon application will have:
- ✅ All configuration issues fixed
- ✅ Comprehensive security measures
- ✅ >80% test coverage
- ✅ Optimized database and caching
- ✅ CI/CD pipeline ready
- ✅ Full monitoring and observability
- ✅ Production-grade error handling
- ✅ Scalable architecture
- ✅ Complete documentation
- ✅ Ready for deployment to any cloud provider

This will transform your application from a development prototype to a production-ready platform.