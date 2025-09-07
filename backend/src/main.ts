import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhooks
  });
  
  // Get config service
  const configService = app.get(ConfigService);
  
  // Enable CORS with comprehensive support
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:10021',
      'http://localhost:3000',
      'http://localhost:10021',
      'http://localhost:10022',
      'http://localhost:10023',
      'http://localhost:10024',
      'http://127.0.0.1:10021',
      'http://127.0.0.1:10022',
      'http://127.0.0.1:10023',
      'http://127.0.0.1:10024',
      'http://[::1]:10021',
      'http://[::1]:10022',
      'http://[::1]:10023',
      'http://[::1]:10024',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept', 
      'X-Requested-With',
      'apollographql-client-name',
      'apollographql-client-version',
      'x-apollo-operation-name',
      'x-apollo-operation-id',
      'Accept-Language',
      'Cache-Control',
      'Pragma'
    ],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // Global JWT guard (with Public decorator exceptions)
  const jwtAuthGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtAuthGuard);
  
  // Set global prefix (but exclude WebSocket and webhooks)
  app.setGlobalPrefix('api', {
    exclude: ['/live', '/payments/webhooks/stripe'],
  });
  
  // Configure body parser limits
  app.use('/api/payments/webhooks/stripe', (req, res, next) => {
    req.setEncoding('utf8');
    next();
  });
  
  const port = configService.get('PORT') || 3001;
  await app.listen(port);
  
  console.log(`🚀 Masterminds Backend API running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground available at: http://localhost:${port}/graphql`);
  console.log(`🔌 WebSocket server available at: ws://localhost:${port}/live`);
  console.log(`💳 Stripe webhooks: http://localhost:${port}/payments/webhooks/stripe`);
  
  // Start background tasks
  console.log('✅ Background tasks started');
}

bootstrap();