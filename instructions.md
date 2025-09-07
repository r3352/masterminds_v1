\# Claude Code Comprehensive Prompt: Masterminds Q\&A Platform Implementation



\## Project Overview \& Mission



You are tasked with building a production-ready Q\&A social platform called "Masterminds" that combines expert knowledge routing, bounty-based incentives, and AI-powered fallbacks. This is a complex, multi-phase project that requires careful orchestration of sub-agents, continuous self-QA through browser MCPs, and iterative refinement.



\## Core Architecture Requirements



Build a platform with these key components:

\- \*\*Frontend\*\*: Next.js 14 App Router with React Server Components, TypeScript, Tailwind CSS + shadcn/ui

\- \*\*Backend\*\*: NestJS microservices architecture with GraphQL

\- \*\*Database\*\*: PostgreSQL 16 with pgvector extension for semantic search

\- \*\*Cache\*\*: Redis 7 with RedisJSON

\- \*\*Search\*\*: OpenSearch for hybrid search capabilities

\- \*\*Real-time\*\*: Socket.IO for live updates

\- \*\*Infrastructure\*\*: AWS ECS Fargate, CloudFront CDN, S3 storage



\## Critical MCP Server Integration



You MUST implement and utilize these MCP servers throughout development:



\### 1. Browser MCP (browserbase/mcp-server-browserbase)

\- Use for testing all UI components in real browsers

\- Validate user flows end-to-end

\- Screenshot each major feature for visual regression testing

\- Test responsive design across different viewports



\### 2. Knowledge Base MCP (Custom)

\- Implement RAG for AI-generated answers

\- Store and retrieve question-answer pairs

\- Build semantic search with vector embeddings

\- Maintain context for specialized domains



\### 3. Code Execution MCP

\- Validate all code answers in sandboxed environments

\- Test Python/JavaScript/SQL responses

\- Ensure code security and prevent injection attacks



\### 4. Payment MCP (Custom Stripe Integration)

\- Handle escrow transactions securely

\- Test payment flows with Stripe test cards

\- Implement KYC verification

\- Monitor for fraud patterns



\## Implementation Strategy with Sub-Agents



\### Phase 1: Foundation Setup (Use Database Agent + DevOps Agent)



\*\*Database Agent Tasks:\*\*

```sql

-- Create comprehensive schema with these tables:

-- users (with embedding column for interests)

-- groups (with semantic routing capabilities)

-- questions (with bounty and SLA tracking)

-- answers (with quality scoring)

-- reputation\_events (with decay factors)

-- escrow\_transactions (Stripe integration)

-- semantic\_routes (AI routing configuration)



-- Implement pgvector for semantic search

CREATE EXTENSION IF NOT EXISTS vector;



-- Add proper indexes for performance

CREATE INDEX idx\_questions\_embedding ON questions USING ivfflat (embedding vector\_cosine\_ops);

```



\*\*DevOps Agent Tasks:\*\*

\- Set up Docker Compose for local development

\- Configure GitHub Actions CI/CD pipeline

\- Create Terraform scripts for AWS infrastructure

\- Set up monitoring with OpenTelemetry



\*\*Self-QA Using Browser MCP:\*\*

```javascript

// Test database connections

await browserMCP.navigate('http://localhost:3000/api/health');

await browserMCP.screenshot('database-health-check.png');

await browserMCP.assertTextPresent('Database: Connected');



// Validate schema creation

await browserMCP.executeSQL('SELECT \* FROM information\_schema.tables');

await browserMCP.verifyTableStructure(\['users', 'groups', 'questions']);

```



\### Phase 2: Core Features (Use Frontend Agent + Backend Agent + AI Agent)



\*\*Frontend Agent Tasks:\*\*

```typescript

// Implement these UI components with full testing:

1\. Question posting interface with rich text editor

2\. Answer submission with code highlighting

3\. Bounty setting with escrow visualization

4\. Real-time voting system

5\. Reputation dashboard with badges



// Each component must be tested via Browser MCP:

const testQuestionPosting = async () => {

&nbsp; await browserMCP.navigate('/ask');

&nbsp; await browserMCP.fillForm({

&nbsp;   title: 'Test Question',

&nbsp;   body: 'Detailed question body',

&nbsp;   bounty: 100

&nbsp; });

&nbsp; await browserMCP.click('button\[type="submit"]');

&nbsp; await browserMCP.waitForElement('.question-success');

&nbsp; await browserMCP.screenshot('question-posted.png');

};

```



\*\*Backend Agent Tasks:\*\*

```typescript

// Implement NestJS microservices:

@Injectable()

export class QuestionService {

&nbsp; async createQuestion(dto: CreateQuestionDto) {

&nbsp;   // 1. Validate input

&nbsp;   // 2. Generate embedding for semantic routing

&nbsp;   // 3. Create escrow transaction

&nbsp;   // 4. Schedule SLA timer

&nbsp;   // 5. Route to appropriate groups

&nbsp;   

&nbsp;   // Self-test using Code Execution MCP

&nbsp;   await codeExecutionMCP.test({

&nbsp;     service: 'QuestionService',

&nbsp;     method: 'createQuestion',

&nbsp;     testCases: \[

&nbsp;       { input: validQuestion, expected: 'success' },

&nbsp;       { input: invalidBounty, expected: 'error' }

&nbsp;     ]

&nbsp;   });

&nbsp; }

}

```



\*\*AI Agent Tasks:\*\*

```typescript

// Implement semantic routing system

class SemanticRouter {

&nbsp; async routeUser(userProfile: UserProfile, question: string) {

&nbsp;   // Generate embeddings

&nbsp;   const embedding = await this.generateEmbedding(question);

&nbsp;   

&nbsp;   // Find similar groups using pgvector

&nbsp;   const groups = await this.findSimilarGroups(embedding);

&nbsp;   

&nbsp;   // Enrich context using Browser MCP

&nbsp;   const enrichedContext = await browserMCP.scrapeContext(question);

&nbsp;   

&nbsp;   // Self-QA: Test routing accuracy

&nbsp;   const testResults = await this.testRoutingAccuracy(\[

&nbsp;     { question: "How to implement OAuth?", expectedGroup: "authentication" },

&nbsp;     { question: "Best React patterns?", expectedGroup: "frontend" }

&nbsp;   ]);

&nbsp;   

&nbsp;   return { groups, confidence: this.calculateConfidence(groups) };

&nbsp; }

}

```



\### Phase 3: Payment \& Escrow System (Use Payment Agent + Security Agent)



\*\*Payment Agent Tasks:\*\*

```typescript

class EscrowService {

&nbsp; async createEscrow(questionId: string, amount: number) {

&nbsp;   // Create Stripe payment intent with manual capture

&nbsp;   const paymentIntent = await stripe.paymentIntents.create({

&nbsp;     amount: amount \* 100,

&nbsp;     currency: 'usd',

&nbsp;     capture\_method: 'manual',

&nbsp;     metadata: { questionId }

&nbsp;   });

&nbsp;   

&nbsp;   // Test using Payment MCP

&nbsp;   await paymentMCP.testTransaction({

&nbsp;     card: '4242424242424242', // Test card

&nbsp;     amount: amount,

&nbsp;     expectHold: true

&nbsp;   });

&nbsp;   

&nbsp;   // Browser MCP validation

&nbsp;   await browserMCP.navigate('/question/' + questionId);

&nbsp;   await browserMCP.assertElementPresent('.escrow-badge');

&nbsp;   await browserMCP.screenshot('escrow-created.png');

&nbsp; }

&nbsp; 

&nbsp; async releasePayout(answerId: string) {

&nbsp;   // Calculate platform fee (10%)

&nbsp;   // Transfer to answerer's Stripe Connect account

&nbsp;   // Update database

&nbsp;   

&nbsp;   // Self-QA: Test payout calculations

&nbsp;   const testCases = \[

&nbsp;     { bounty: 100, expectedPayout: 90 },

&nbsp;     { bounty: 50, expectedPayout: 45 }

&nbsp;   ];

&nbsp;   await this.validatePayoutCalculations(testCases);

&nbsp; }

}

```



\*\*Security Agent Tasks:\*\*

```typescript

class FraudDetectionService {

&nbsp; async detectCollusion(question: Question, answer: Answer) {

&nbsp;   const checks = \[

&nbsp;     this.checkIPProximity(),

&nbsp;     this.checkTimingPatterns(),

&nbsp;     this.checkDeviceFingerprint(),

&nbsp;     this.checkAnswerSimilarity()

&nbsp;   ];

&nbsp;   

&nbsp;   // Test fraud detection using Browser MCP

&nbsp;   await browserMCP.simulateUserBehavior({

&nbsp;     user1: { ip: '192.168.1.1', device: 'device-1' },

&nbsp;     user2: { ip: '192.168.1.1', device: 'device-1' },

&nbsp;     action: 'answer-question',

&nbsp;     expectFlag: true

&nbsp;   });

&nbsp; }

}

```



\### Phase 4: Reputation System (Use Analytics Agent + Testing Agent)



\*\*Analytics Agent Tasks:\*\*

```typescript

class ReputationEngine {

&nbsp; async calculateReputation(userId: string, groupId: string) {

&nbsp;   // Implement PageRank-style algorithm

&nbsp;   // Apply time decay (0.95 monthly)

&nbsp;   // Weight votes by voter reputation

&nbsp;   

&nbsp;   // Self-QA using test data

&nbsp;   const testUser = await this.createTestUser({

&nbsp;     answers: 10,

&nbsp;     acceptedAnswers: 5,

&nbsp;     upvotes: 50

&nbsp;   });

&nbsp;   

&nbsp;   const reputation = await this.calculate(testUser.id);

&nbsp;   assert(reputation.score > 500, 'Reputation calculation error');

&nbsp;   

&nbsp;   // Visual validation

&nbsp;   await browserMCP.navigate(`/user/${testUser.id}/reputation`);

&nbsp;   await browserMCP.screenshot('reputation-display.png');

&nbsp; }

}

```



\### Phase 5: AI Answer Generation (Use AI Agent + Quality Agent)



\*\*AI Agent Tasks:\*\*

```typescript

class AIAnswerService {

&nbsp; async generateAnswer(question: Question) {

&nbsp;   // Retrieve context using Knowledge MCP

&nbsp;   const context = await knowledgeMCP.retrieve({

&nbsp;     query: question.body,

&nbsp;     topK: 5

&nbsp;   });

&nbsp;   

&nbsp;   // Generate answer with GPT-4

&nbsp;   const answer = await this.llm.generate({

&nbsp;     prompt: this.buildRAGPrompt(question, context),

&nbsp;     maxTokens: 2000

&nbsp;   });

&nbsp;   

&nbsp;   // Validate code in answer

&nbsp;   if (this.containsCode(answer)) {

&nbsp;     const codeValid = await codeExecutionMCP.validate(answer);

&nbsp;     if (!codeValid) {

&nbsp;       return this.regenerateWithCorrections(answer);

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   // Quality check

&nbsp;   const qualityScore = await this.evaluateQuality(answer);

&nbsp;   assert(qualityScore > 0.7, 'Answer quality too low');

&nbsp;   

&nbsp;   return { answer, sources: context, qualityScore };

&nbsp; }

}

```



\## Continuous Self-QA Protocol



\### Every 10 minutes during development:

```typescript

async function continuousSelfQA() {

&nbsp; // 1. Health checks

&nbsp; const health = await browserMCP.checkEndpoints(\[

&nbsp;   '/api/health',

&nbsp;   '/api/questions',

&nbsp;   '/api/payments'

&nbsp; ]);

&nbsp; 

&nbsp; // 2. User flow testing

&nbsp; await browserMCP.executeUserFlow({

&nbsp;   steps: \[

&nbsp;     { action: 'register', data: generateTestUser() },

&nbsp;     { action: 'postQuestion', data: generateTestQuestion() },

&nbsp;     { action: 'submitAnswer', data: generateTestAnswer() },

&nbsp;     { action: 'acceptAnswer', validate: 'escrowReleased' }

&nbsp;   ]

&nbsp; });

&nbsp; 

&nbsp; // 3. Performance monitoring

&nbsp; const metrics = await browserMCP.measurePerformance({

&nbsp;   pages: \['/', '/questions', '/ask'],

&nbsp;   metrics: \['FCP', 'LCP', 'CLS', 'FID']

&nbsp; });

&nbsp; 

&nbsp; // 4. Visual regression testing

&nbsp; await browserMCP.compareScreenshots({

&nbsp;   baseline: './screenshots/baseline/',

&nbsp;   current: './screenshots/current/',

&nbsp;   threshold: 0.01

&nbsp; });

&nbsp; 

&nbsp; // 5. Database integrity

&nbsp; await this.validateDatabaseIntegrity();

&nbsp; 

&nbsp; // 6. Payment system verification

&nbsp; await paymentMCP.verifyEscrowBalance();

&nbsp; 

&nbsp; // Generate report

&nbsp; return generateQAReport({ health, metrics, screenshots });

}

```



\### Critical Test Scenarios



```typescript

const criticalTests = {

&nbsp; // Payment edge cases

&nbsp; async testPaymentEdgeCases() {

&nbsp;   await this.testZeroBounty();

&nbsp;   await this.testMaxBounty();

&nbsp;   await this.testExpiredSLA();

&nbsp;   await this.testDisputedAnswer();

&nbsp; },

&nbsp; 

&nbsp; // Concurrency testing

&nbsp; async testConcurrency() {

&nbsp;   const users = await this.createTestUsers(100);

&nbsp;   await Promise.all(users.map(u => this.simulateUserActivity(u)));

&nbsp;   await this.verifyNoDeadlocks();

&nbsp;   await this.verifyDataConsistency();

&nbsp; },

&nbsp; 

&nbsp; // Security testing

&nbsp; async testSecurity() {

&nbsp;   await this.testSQLInjection();

&nbsp;   await this.testXSS();

&nbsp;   await this.testPromptInjection();

&nbsp;   await this.testRateLimiting();

&nbsp; }

};

```



\## Deployment Checklist with Browser MCP Validation



```typescript

async function deploymentValidation() {

&nbsp; const stages = \['local', 'staging', 'production'];

&nbsp; 

&nbsp; for (const stage of stages) {

&nbsp;   console.log(`Validating ${stage} environment...`);

&nbsp;   

&nbsp;   // 1. Infrastructure validation

&nbsp;   await browserMCP.validateInfrastructure({

&nbsp;     databases: \['postgresql', 'redis', 'opensearch'],

&nbsp;     services: \['api', 'websocket', 'worker'],

&nbsp;     stage

&nbsp;   });

&nbsp;   

&nbsp;   // 2. Feature validation

&nbsp;   const features = \[

&nbsp;     'userRegistration',

&nbsp;     'questionPosting',

&nbsp;     'answerSubmission',

&nbsp;     'paymentProcessing',

&nbsp;     'aiGeneration'

&nbsp;   ];

&nbsp;   

&nbsp;   for (const feature of features) {

&nbsp;     const result = await browserMCP.testFeature(feature, stage);

&nbsp;     if (!result.success) {

&nbsp;       throw new Error(`Feature ${feature} failed in ${stage}`);

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   // 3. Performance benchmarks

&nbsp;   const benchmarks = await browserMCP.runBenchmarks({

&nbsp;     concurrent\_users: 1000,

&nbsp;     duration: '5m',

&nbsp;     stage

&nbsp;   });

&nbsp;   

&nbsp;   assert(benchmarks.p95\_latency < 500, 'Latency too high');

&nbsp;   assert(benchmarks.error\_rate < 0.01, 'Error rate too high');

&nbsp;   

&nbsp;   // 4. Generate deployment report

&nbsp;   await generateDeploymentReport({ stage, features, benchmarks });

&nbsp; }

}

```



\## Success Criteria



Your implementation must meet these criteria before considering the project complete:



1\. \*\*Functional Requirements\*\*

&nbsp;  - \[ ] 100% of user flows work end-to-end

&nbsp;  - \[ ] AI answers generated for 100% of unanswered questions after 24h

&nbsp;  - \[ ] Payment escrow releases correctly 100% of the time

&nbsp;  - \[ ] Reputation calculations are accurate and update in real-time



2\. \*\*Performance Requirements\*\*

&nbsp;  - \[ ] Page load time < 2 seconds (P95)

&nbsp;  - \[ ] API response time < 200ms (P95)

&nbsp;  - \[ ] Can handle 10,000 concurrent users

&nbsp;  - \[ ] Database queries optimized (no N+1 problems)



3\. \*\*Quality Requirements\*\*

&nbsp;  - \[ ] Test coverage > 80%

&nbsp;  - \[ ] All Browser MCP visual tests passing

&nbsp;  - \[ ] Zero critical security vulnerabilities

&nbsp;  - \[ ] Accessibility score > 95



4\. \*\*Self-QA Requirements\*\*

&nbsp;  - \[ ] Automated tests run every commit

&nbsp;  - \[ ] Browser MCP validates all user flows hourly

&nbsp;  - \[ ] Payment reconciliation runs daily

&nbsp;  - \[ ] Performance benchmarks run before each deployment



\## Final Instructions



1\. \*\*Start with MCP setup first\*\* - Get all MCP servers running before writing any application code

2\. \*\*Use sub-agents for parallel development\*\* - Assign specific domains to each agent

3\. \*\*Test continuously\*\* - Use Browser MCP to test every feature as you build it

4\. \*\*Document everything\*\* - Generate API docs, architecture diagrams, and runbooks

5\. \*\*Monitor religiously\*\* - Set up alerts for any degradation in performance or functionality



Remember: This is a production system handling real money. Every line of code must be tested, every edge case must be handled, and every user flow must be validated through Browser MCP. Use the self-QA protocol religiously to ensure quality at every step.



Begin by setting up the MCP servers and creating the foundational architecture. Then proceed phase by phase, using sub-agents for parallel work and Browser MCP for continuous validation.

