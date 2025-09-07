# Masterminds Q&A Platform

A production-ready Q&A platform with expert routing, bounty payments, AI-powered answers, and real-time features.

## 🏗️ Architecture Overview

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with pgvector extension for embeddings
- **API**: GraphQL with Apollo Server
- **Authentication**: JWT with 2FA support
- **Payment**: Stripe integration with escrow system
- **Real-time**: Socket.IO WebSocket gateway
- **AI**: OpenAI integration for embeddings and answer generation
- **Cache**: Redis for session management

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **UI**: React 18 + TypeScript + Tailwind CSS
- **Components**: Radix UI primitives with custom styling
- **GraphQL**: Apollo Client for API communication
- **Real-time**: Socket.IO client integration

## 🚀 Features Implemented

### ✅ Phase 1: Foundation Setup
- **Database & Migration Agent**
  - TypeORM configuration with PostgreSQL + pgvector
  - Entity relationships and migrations
  - Comprehensive database seeder with realistic test data
  - Support for vector embeddings storage

- **Authentication & Security Agent**
  - JWT-based authentication with refresh tokens
  - Two-factor authentication (2FA) with TOTP
  - Google OAuth integration
  - Role-based access control (User, Expert, Moderator, Admin)
  - Password strength validation and secure hashing
  - Session management with Redis

### ✅ Phase 2: Core Services
- **Backend Core Services Agent**
  - Users & Groups management with expertise levels
  - Questions lifecycle with status management
  - Answers with acceptance and quality scoring
  - Voting system for questions and answers
  - Reputation system with point tracking
  - Comprehensive GraphQL API with resolvers

- **Payment & Escrow Agent**
  - Stripe payment intent creation
  - Escrow system for bounty payments
  - Stripe Connect for expert payouts
  - Automated escrow release/refund logic
  - Webhook handling for payment events
  - Platform fee calculation (5%)

### ✅ Phase 3: Intelligence Layer
- **AI & Search Agent**
  - OpenAI integration for answer generation
  - Semantic search with vector embeddings
  - Expert routing based on similarity matching
  - Content quality assessment
  - Automated tag extraction
  - Similar content discovery

### ✅ Phase 4: Real-time Features
- **WebSocket Gateway**
  - Real-time notifications for all major events
  - Live user presence tracking
  - Question viewer tracking
  - Typing indicators
  - Expert routing notifications
  - Payment completion alerts

## 🛠️ Technology Stack

### Backend Dependencies
```json
{
  "@nestjs/common": "^10.0.0",
  "@nestjs/graphql": "^12.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "@nestjs/jwt": "^10.0.0",
  "@nestjs/websockets": "^10.0.0",
  "typeorm": "^0.3.17",
  "pg": "^8.11.0",
  "redis": "^4.6.0",
  "stripe": "^14.9.0",
  "openai": "^4.0.0",
  "socket.io": "^4.7.0",
  "bcrypt": "^5.1.0",
  "speakeasy": "^2.0.0",
  "google-auth-library": "^9.2.0"
}
```

### Frontend Dependencies
```json
{
  "next": "14.0.0",
  "react": "^18.2.0",
  "@apollo/client": "^3.8.0",
  "tailwindcss": "^3.3.0",
  "@radix-ui/react-slot": "^1.2.3",
  "lucide-react": "^0.292.0"
}
```

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL with pgvector extension
- Redis server
- Docker (optional)

### Environment Variables

Create `.env` files in backend and frontend directories:

**Backend `.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/masterminds
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=http://localhost:10021
NODE_ENV=development
```

**Frontend environment variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Installation & Setup

1. **Clone and install dependencies:**
```bash
cd kondon
cd backend && npm install
cd ../frontend && npm install
```

2. **Start infrastructure services:**
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up postgres redis -d
```

3. **Run database migrations:**
```bash
cd backend
npm run migration:run
```

4. **Seed database (optional):**
```bash
# Run the seeder to populate with test data
npm run seed
```

5. **Start development servers:**
```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Development Commands

**Backend:**
```bash
npm run start:dev          # Development server
npm run build             # Production build
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run migration:generate # Generate migration
npm run migration:run     # Run migrations
```

**Frontend:**
```bash
npm run dev               # Development server (port 10021)
npm run build             # Production build
npm run lint              # Next.js linting
```

## 📡 API Endpoints

### GraphQL API
- **Endpoint**: `http://localhost:3001/graphql`
- **Playground**: Available in development mode
- **Authentication**: Bearer token required (except public queries)

### REST Endpoints
- **Stripe Webhooks**: `POST /payments/webhooks/stripe`
- **Health Check**: `GET /api/health`

### WebSocket
- **Endpoint**: `ws://localhost:3001/live`
- **Authentication**: JWT token required
- **Events**: Real-time notifications, presence, typing indicators

## 🏗️ Database Schema

### Core Entities
- **Users**: Authentication, profile, reputation
- **Groups**: Expert categories with membership levels  
- **Questions**: Q&A content with bounties and embeddings
- **Answers**: Response content with quality scoring
- **Votes**: Community voting on questions/answers
- **EscrowTransactions**: Bounty payment management
- **ReputationEvents**: Point history tracking
- **SemanticRoutes**: AI-powered expert routing

### Key Relationships
```
Users ←→ UserGroupMemberships ←→ Groups
Users → Questions → Answers
Users → Votes → Questions/Answers
Users → EscrowTransactions ← Questions
Questions → SemanticRoutes → Users (experts)
```

## 🔐 Authentication & Authorization

### Authentication Methods
1. **Email/Password** with JWT tokens
2. **Google OAuth** integration
3. **Two-Factor Authentication** (2FA) with TOTP

### Role-Based Access Control
- **User**: Basic platform access
- **Expert**: High reputation users (1000+ points)
- **Moderator**: Group management permissions
- **Admin**: Full platform administration

### Security Features
- Password strength validation
- Rate limiting with throttling
- JWT token expiration and refresh
- Secure password hashing with bcrypt
- 2FA with backup codes

## 💰 Payment System

### Stripe Integration
- **Payment Intents** for secure payment collection
- **Stripe Connect** for expert payouts
- **Webhook Events** for real-time payment updates
- **Escrow System** for bounty management

### Escrow Workflow
1. Question author creates bounty
2. Payment held in escrow
3. Expert provides answer
4. Author accepts answer
5. Payment released to expert (minus 5% platform fee)

## 🤖 AI Features

### OpenAI Integration
- **Text Embeddings** for semantic search
- **Answer Generation** with GPT-4
- **Content Quality Assessment**
- **Expert Routing** based on similarity

### Semantic Search
- Vector-based question/answer similarity
- Real-time content embeddings
- Contextual expert matching
- Related content suggestions

## 🔄 Real-time Features

### WebSocket Events
- **Notifications**: Question/answer/vote events
- **Presence**: User online/offline status
- **Activity**: Live question viewing
- **Typing**: Real-time typing indicators
- **Payments**: Bounty completion alerts

### Live Updates
- Question and answer creation
- Vote changes and reputation updates
- Expert routing notifications
- Payment status changes

## 🧪 Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete user workflows
- **Database Tests**: Repository operations

### Frontend Testing
- **Component Tests**: React component behavior
- **Integration Tests**: API communication
- **E2E Tests**: User interface workflows

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup
1. Configure production environment variables
2. Set up PostgreSQL with pgvector extension
3. Configure Redis for session management
4. Set up Stripe webhooks endpoint
5. Configure OpenAI API access

### Infrastructure Requirements
- **Database**: PostgreSQL 14+ with pgvector
- **Cache**: Redis 6+
- **CDN**: For static assets (recommended)
- **SSL**: HTTPS certificate for production

## 📈 Monitoring & Analytics

### Application Metrics
- User activity and engagement
- Question/answer quality scores
- Payment transaction success rates
- AI confidence scores and accuracy

### Performance Monitoring
- API response times
- Database query performance
- WebSocket connection health
- Payment processing latency

## 🔧 Configuration

### Feature Flags
- AI answer generation toggle
- Payment system enable/disable
- Real-time notifications toggle
- Expert routing automation

### Customization Options
- Platform fee percentage
- Reputation scoring weights
- AI confidence thresholds
- Auto-escrow release timing

## 📚 API Documentation

### GraphQL Schema
The GraphQL schema is auto-generated and available at `/graphql` in development mode. Key query and mutation types include:

**Authentication:**
- `login`, `register`, `refreshToken`
- `enable2FA`, `verify2FA`, `me`

**Content Management:**
- `questions`, `createQuestion`, `updateQuestion`
- `answers`, `createAnswer`, `acceptAnswer`
- `voteQuestion`, `voteAnswer`

**Payment System:**
- `createEscrow`, `releaseEscrow`, `refundEscrow`
- `createPaymentIntent`, `stripeConnectStatus`

**AI Features:**
- `semanticSearch`, `generateAnswer`
- `routeToExperts`, `findSimilarContent`

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Run linting and tests
5. Submit pull request

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Comprehensive error handling
- Input validation with class-validator
- Documentation for public APIs

## 📄 License

MIT License - see LICENSE file for details.

---

## 🎯 Implementation Status

✅ **Completed Features:**
- Complete backend API with GraphQL
- Authentication system with 2FA
- Payment & escrow system  
- AI-powered semantic search
- Real-time WebSocket features
- Database schema & migrations

🚧 **In Progress:**
- Frontend UI implementation
- Comprehensive test coverage

📋 **Next Steps:**
- Frontend integration with backend API
- E2E testing setup
- Performance optimization
- Production deployment guide

---

*Built with ❤️ using NestJS, Next.js, and modern web technologies*