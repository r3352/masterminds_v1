import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-redis-store';

// Import modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { PaymentsModule } from './payments/payments.module';
import { ReputationModule } from './reputation/reputation.module';
import { AiModule } from './ai/ai.module';
import { WebSocketsModule } from './websockets/websockets.module';

// Import entities
import { User } from './users/entities/user.entity';
import { Group } from './users/entities/group.entity';
import { Question } from './questions/entities/question.entity';
import { Answer } from './answers/entities/answer.entity';
import { ReputationEvent } from './reputation/entities/reputation-event.entity';
import { EscrowTransaction } from './payments/entities/escrow-transaction.entity';
import { SemanticRoute } from './ai/entities/semantic-route.entity';
import { UserGroupMembership } from './users/entities/user-group-membership.entity';
import { Vote } from './common/entities/vote.entity';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          User,
          Group,
          Question,
          Answer,
          ReputationEvent,
          EscrowTransaction,
          SemanticRoute,
          UserGroupMembership,
          Vote,
        ],
        synchronize: false, // We use migrations
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),
    
    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        playground: configService.get('NODE_ENV') === 'development',
        introspection: true,
        context: ({ req, res }) => ({ req, res }),
        cors: {
          origin: [
            configService.get('FRONTEND_URL') || 'http://localhost:10021',
            'http://localhost:3000',
            'http://localhost:10021',
            'http://127.0.0.1:10021',
            'http://[::1]:10021',
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
        },
      }),
      inject: [ConfigService],
    }),
    
    // Redis Cache
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore as any,
        url: configService.get('REDIS_URL'),
        ttl: 300, // 5 minutes default
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    } as any),
    
    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    
    // Feature modules
    AuthModule,
    UsersModule,
    QuestionsModule,
    AnswersModule,
    PaymentsModule,
    ReputationModule,
    AiModule,
    WebSocketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}