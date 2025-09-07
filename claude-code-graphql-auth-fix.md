# Comprehensive Claude Code Prompt for GraphQL/Auth System Fix with Browser Validation

## Project Context
You are working on the Kondon project located at `C:\Users\admin\Documents\kondon`. This is a full-stack Q&A platform with:
- **Backend**: NestJS with GraphQL (Apollo Server), TypeORM, PostgreSQL, JWT Auth
- **Frontend**: Next.js with Apollo Client
- **Infrastructure**: Docker, Redis, PostgreSQL
- **Critical Issue**: Registration and authentication GraphQL mutations are failing

## Primary Objectives
1. Fix ALL GraphQL/API communication errors
2. **PRIORITY**: Ensure registration and authentication workflows function end-to-end
3. Validate fixes using browser MCP for real-world testing
4. Implement self-QA procedures to verify all changes

## Sub-Agent Task Distribution

### Sub-Agent 1: Schema Auditor & Auth Analyzer
**Role**: Deep analysis of authentication-related schema and operations

**Tasks**:
1. **Authentication Schema Analysis**
   ```
   Priority files to analyze:
   - backend/src/auth/auth.resolver.ts
   - backend/src/auth/auth.service.ts
   - backend/src/auth/dto/auth.dto.ts
   - backend/src/users/entities/user.entity.ts
   - backend/schema.gql (auth-related sections)
   
   Document:
   - All auth mutations (register, login, googleLogin, refreshToken, etc.)
   - Required vs optional fields
   - Field naming patterns (snake_case vs camelCase)
   - JWT token structure and claims
   ```

2. **Frontend Auth Flow Mapping**
   ```
   Analyze:
   - frontend/src/lib/graphql/auth.ts
   - frontend/src/app/auth/register/*
   - frontend/src/app/auth/login/*
   - frontend/src/contexts/AuthContext.tsx (if exists)
   - frontend/src/hooks/useAuth.ts (if exists)
   
   Document:
   - How registration form data is collected
   - How login credentials are submitted
   - Token storage mechanism (localStorage, cookies, etc.)
   - Protected route implementation
   ```

3. **Generate Critical Issues Report**
   ```markdown
   # Authentication System Issues Report
   
   ## Critical Blockers
   1. REGISTER_MUTATION uses 'createUserDto' instead of 'input'
   2. Field mapping mismatches (e.g., 'accessToken' vs 'access_token')
   3. Missing required fields in mutations
   
   ## Data Flow Issues
   - Form data structure vs DTO expectations
   - Response handling mismatches
   - Token refresh mechanism problems
   ```

### Sub-Agent 2: Backend Auth Fixer
**Role**: Fix all backend authentication issues

**Tasks**:
1. **Standardize Auth Resolver**
   ```typescript
   // Fix auth.resolver.ts to ensure consistent patterns:
   
   @Resolver()
   export class AuthResolver {
     @Public()
     @Mutation(() => AuthResponse)
     async register(
       @Args('input', ValidationPipe) input: CreateUserDto,
     ): Promise<AuthResponse> {
       // Ensure returns correct structure
       const result = await this.authService.register(input);
       return {
         access_token: result.accessToken,
         refresh_token: result.refreshToken,
         expires_in: result.expiresIn,
         user: this.mapUserToResponse(result.user)
       };
     }
     
     @Public()
     @Mutation(() => AuthResponse)
     async login(
       @Args('input', ValidationPipe) input: LoginDto,
     ): Promise<AuthResponse> {
       // Similar structure
     }
   }
   ```

2. **Fix DTOs and Ensure Validation**
   ```typescript
   // auth.dto.ts fixes:
   
   @InputType()
   export class CreateUserDto {
     @Field()
     @IsEmail()
     email: string;
     
     @Field()
     @IsString()
     @MinLength(3)
     username: string;
     
     @Field()
     @IsString()
     @MinLength(8)
     password: string;
     
     @Field({ nullable: true })
     @IsOptional()
     @IsString()
     full_name?: string;
   }
   
   @ObjectType()
   export class AuthResponse {
     @Field()
     access_token: string;
     
     @Field()
     refresh_token: string;
     
     @Field()
     expires_in: number;
     
     @Field(() => UserResponse)
     user: UserResponse;
   }
   ```

3. **Ensure JWT Service Works**
   ```typescript
   // Validate JWT configuration:
   - Check JWT_SECRET is set in .env
   - Verify token expiration times
   - Ensure refresh token mechanism works
   - Add proper error handling
   ```

### Sub-Agent 3: Frontend Auth Synchronizer
**Role**: Align frontend with fixed backend auth system

**Tasks**:
1. **Fix All Auth Mutations**
   ```typescript
   // frontend/src/lib/graphql/auth.ts
   
   export const REGISTER_MUTATION = gql`
     mutation Register($input: CreateUserDto!) {
       register(input: $input) {
         access_token
         refresh_token
         expires_in
         user {
           id
           email
           username
           full_name
           avatar_url
           reputation_score
           email_verified
           is_active
         }
       }
     }
   `;
   
   export const LOGIN_MUTATION = gql`
     mutation Login($input: LoginDto!) {
       login(input: $input) {
         access_token
         refresh_token
         expires_in
         user {
           id
           email
           username
           full_name
           avatar_url
           reputation_score
           email_verified
           is_active
         }
       }
     }
   `;
   ```

2. **Create/Fix Auth Context**
   ```typescript
   // frontend/src/contexts/AuthContext.tsx
   
   interface AuthContextType {
     user: User | null;
     loading: boolean;
     login: (credentials: LoginInput) => Promise<void>;
     register: (userData: RegisterInput) => Promise<void>;
     logout: () => Promise<void>;
     refreshToken: () => Promise<void>;
   }
   
   export const AuthProvider: React.FC = ({ children }) => {
     // Implement with proper error handling
     // Store tokens securely
     // Handle token refresh automatically
   };
   ```

3. **Fix Registration Component**
   ```typescript
   // frontend/src/app/auth/register/page.tsx
   
   const RegisterPage = () => {
     const [register] = useMutation(REGISTER_MUTATION);
     
     const handleSubmit = async (formData) => {
       try {
         const { data } = await register({
           variables: {
             input: {  // Note: 'input' not 'createUserDto'
               email: formData.email,
               username: formData.username,
               password: formData.password,
               full_name: formData.fullName
             }
           }
         });
         
         // Store tokens
         localStorage.setItem('access_token', data.register.access_token);
         localStorage.setItem('refresh_token', data.register.refresh_token);
         
         // Redirect to dashboard
       } catch (error) {
         // Handle errors properly
       }
     };
   };
   ```

### Sub-Agent 4: Browser Testing Orchestrator (MCP)
**Role**: Use browser MCP to validate authentication flows work end-to-end

**Tasks**:
1. **Setup Browser Testing Environment**
   ```javascript
   // Using Playwright MCP from .playwright-mcp directory
   
   const testConfig = {
     baseURL: 'http://localhost:3000',
     credentials: {
       testUser: {
         email: 'test@example.com',
         username: 'testuser',
         password: 'TestPass123!',
         fullName: 'Test User'
       }
     }
   };
   ```

2. **Registration Flow Test**
   ```javascript
   async function testRegistrationFlow() {
     // Start the application
     await startApplication();
     
     // Open browser using MCP
     const browser = await mcp.playwright.launch({ headless: false });
     const page = await browser.newPage();
     
     // Navigate to registration page
     await page.goto(`${testConfig.baseURL}/auth/register`);
     
     // Fill registration form
     await page.fill('input[name="email"]', testConfig.credentials.testUser.email);
     await page.fill('input[name="username"]', testConfig.credentials.testUser.username);
     await page.fill('input[name="password"]', testConfig.credentials.testUser.password);
     await page.fill('input[name="fullName"]', testConfig.credentials.testUser.fullName);
     
     // Monitor network for GraphQL request
     const responsePromise = page.waitForResponse(response => 
       response.url().includes('/graphql') && 
       response.request().postData()?.includes('register')
     );
     
     // Submit form
     await page.click('button[type="submit"]');
     
     // Check response
     const response = await responsePromise;
     const responseBody = await response.json();
     
     // Validate response
     assert(response.status() === 200, 'Registration request should succeed');
     assert(!responseBody.errors, 'No GraphQL errors should occur');
     assert(responseBody.data.register.access_token, 'Should receive access token');
     assert(responseBody.data.register.user.email === testConfig.credentials.testUser.email);
     
     // Check if redirected to dashboard
     await page.waitForURL('**/dashboard');
     
     // Verify user is logged in
     const userInfo = await page.textContent('[data-testid="user-info"]');
     assert(userInfo.includes(testConfig.credentials.testUser.username));
     
     console.log('✅ Registration flow test passed');
     return true;
   }
   ```

3. **Login Flow Test**
   ```javascript
   async function testLoginFlow() {
     const browser = await mcp.playwright.launch({ headless: false });
     const page = await browser.newPage();
     
     // Navigate to login page
     await page.goto(`${testConfig.baseURL}/auth/login`);
     
     // Fill login form
     await page.fill('input[name="identifier"]', testConfig.credentials.testUser.email);
     await page.fill('input[name="password"]', testConfig.credentials.testUser.password);
     
     // Monitor GraphQL request
     const responsePromise = page.waitForResponse(response => 
       response.url().includes('/graphql') && 
       response.request().postData()?.includes('login')
     );
     
     // Submit
     await page.click('button[type="submit"]');
     
     // Validate response
     const response = await responsePromise;
     const responseBody = await response.json();
     
     assert(response.status() === 200);
     assert(!responseBody.errors);
     assert(responseBody.data.login.access_token);
     
     // Check localStorage for tokens
     const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
     assert(accessToken, 'Access token should be stored');
     
     console.log('✅ Login flow test passed');
     return true;
   }
   ```

4. **Protected Route Test**
   ```javascript
   async function testProtectedRoutes() {
     const browser = await mcp.playwright.launch({ headless: false });
     const page = await browser.newPage();
     
     // Try accessing protected route without auth
     await page.goto(`${testConfig.baseURL}/dashboard`);
     await page.waitForURL('**/auth/login'); // Should redirect to login
     
     // Login first
     await performLogin(page);
     
     // Now try accessing protected route
     await page.goto(`${testConfig.baseURL}/dashboard`);
     await page.waitForSelector('[data-testid="dashboard-content"]');
     
     // Make authenticated GraphQL request
     const response = await page.evaluate(async () => {
       const token = localStorage.getItem('access_token');
       const result = await fetch('/graphql', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify({
           query: `query Me { me { id email username } }`
         })
       });
       return result.json();
     });
     
     assert(response.data.me.email, 'Should fetch user data with auth token');
     
     console.log('✅ Protected route test passed');
     return true;
   }
   ```

5. **Token Refresh Test**
   ```javascript
   async function testTokenRefresh() {
     // Test automatic token refresh mechanism
     const browser = await mcp.playwright.launch({ headless: false });
     const page = await browser.newPage();
     
     // Login and get tokens
     await performLogin(page);
     
     // Manually expire access token (simulate)
     await page.evaluate(() => {
       const expiredToken = 'expired.token.here';
       localStorage.setItem('access_token', expiredToken);
     });
     
     // Make request that should trigger refresh
     const response = await page.evaluate(async () => {
       // Your app should detect expired token and refresh
       const result = await fetch('/graphql', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${localStorage.getItem('access_token')}`
         },
         body: JSON.stringify({
           query: `query Me { me { id } }`
         })
       });
       return result.json();
     });
     
     // Check if token was refreshed
     const newToken = await page.evaluate(() => localStorage.getItem('access_token'));
     assert(newToken !== 'expired.token.here', 'Token should be refreshed');
     
     console.log('✅ Token refresh test passed');
     return true;
   }
   ```

### Sub-Agent 5: Self-QA Validator
**Role**: Comprehensive quality assurance and validation

**Tasks**:
1. **Create Validation Checklist**
   ```markdown
   ## Authentication System QA Checklist
   
   ### Backend Validation
   - [ ] GraphQL schema compiled without errors
   - [ ] All auth mutations return correct response structure
   - [ ] JWT tokens are properly signed and valid
   - [ ] Password hashing works (bcrypt)
   - [ ] Email validation works
   - [ ] Username uniqueness enforced
   - [ ] Refresh token mechanism works
   - [ ] Error messages are user-friendly
   - [ ] Rate limiting on auth endpoints
   - [ ] SQL injection prevention
   
   ### Frontend Validation
   - [ ] Registration form validates input
   - [ ] Login form handles both email and username
   - [ ] Tokens stored securely
   - [ ] Auto-refresh before expiration
   - [ ] Logout clears all auth data
   - [ ] Protected routes redirect properly
   - [ ] Error messages displayed correctly
   - [ ] Loading states during auth operations
   - [ ] Success notifications work
   - [ ] Form resets after submission
   
   ### Integration Validation
   - [ ] Registration creates user in database
   - [ ] Login returns valid JWT tokens
   - [ ] Protected endpoints require valid token
   - [ ] Token refresh extends session
   - [ ] Logout invalidates session
   - [ ] Google OAuth works (if implemented)
   - [ ] 2FA flow works (if implemented)
   - [ ] Password reset works
   - [ ] Email verification works
   - [ ] Account activation works
   ```

2. **Automated Test Suite**
   ```javascript
   // test-auth-system.js
   
   async function runFullAuthTestSuite() {
     console.log('🚀 Starting comprehensive auth system validation...\n');
     
     const tests = [
       { name: 'Backend Health Check', fn: testBackendHealth },
       { name: 'GraphQL Schema Validation', fn: testGraphQLSchema },
       { name: 'Registration Flow', fn: testRegistrationFlow },
       { name: 'Login Flow', fn: testLoginFlow },
       { name: 'Protected Routes', fn: testProtectedRoutes },
       { name: 'Token Refresh', fn: testTokenRefresh },
       { name: 'Logout Flow', fn: testLogoutFlow },
       { name: 'Error Handling', fn: testErrorHandling },
       { name: 'Security Tests', fn: testSecurityMeasures },
       { name: 'Performance Tests', fn: testAuthPerformance }
     ];
     
     const results = [];
     
     for (const test of tests) {
       console.log(`Running: ${test.name}...`);
       try {
         const result = await test.fn();
         results.push({ name: test.name, passed: true, result });
         console.log(`✅ ${test.name} passed\n`);
       } catch (error) {
         results.push({ name: test.name, passed: false, error: error.message });
         console.log(`❌ ${test.name} failed: ${error.message}\n`);
       }
     }
     
     // Generate report
     generateQAReport(results);
   }
   ```

3. **Security Validation**
   ```javascript
   async function testSecurityMeasures() {
     const page = await mcp.playwright.launch().newPage();
     
     // Test SQL injection in registration
     await page.goto(`${testConfig.baseURL}/auth/register`);
     await page.fill('input[name="email"]', "test'; DROP TABLE users; --");
     await page.fill('input[name="password"]', "password");
     await page.click('button[type="submit"]');
     
     // Should get validation error, not SQL error
     const error = await page.textContent('.error-message');
     assert(error.includes('valid email'), 'Should validate email format');
     
     // Test XSS in username
     await page.fill('input[name="username"]', '<script>alert("XSS")</script>');
     await page.click('button[type="submit"]');
     
     // Should sanitize input
     const response = await page.waitForResponse(r => r.url().includes('/graphql'));
     const body = await response.json();
     assert(!body.data?.register?.user?.username?.includes('<script>'));
     
     // Test password requirements
     await page.fill('input[name="password"]', '123'); // Too short
     await page.click('button[type="submit"]');
     const passwordError = await page.textContent('.password-error');
     assert(passwordError.includes('at least 8 characters'));
     
     // Test rate limiting
     for (let i = 0; i < 10; i++) {
       await page.click('button[type="submit"]');
     }
     const rateLimitError = await page.textContent('.error-message');
     assert(rateLimitError.includes('Too many attempts'));
     
     return true;
   }
   ```

4. **Performance Testing**
   ```javascript
   async function testAuthPerformance() {
     const metrics = {
       registrationTime: [],
       loginTime: [],
       tokenRefreshTime: []
     };
     
     // Test registration performance
     for (let i = 0; i < 5; i++) {
       const start = Date.now();
       await performRegistration(`user${i}@test.com`);
       metrics.registrationTime.push(Date.now() - start);
     }
     
     // Test login performance
     for (let i = 0; i < 5; i++) {
       const start = Date.now();
       await performLogin(`user${i}@test.com`);
       metrics.loginTime.push(Date.now() - start);
     }
     
     // Calculate averages
     const avgRegistration = average(metrics.registrationTime);
     const avgLogin = average(metrics.loginTime);
     
     // Assert performance requirements
     assert(avgRegistration < 2000, 'Registration should complete within 2 seconds');
     assert(avgLogin < 1000, 'Login should complete within 1 second');
     
     console.log(`Performance Metrics:
       - Avg Registration: ${avgRegistration}ms
       - Avg Login: ${avgLogin}ms
     `);
     
     return true;
   }
   ```

## Execution Strategy

### Phase 1: Initial Assessment
```bash
# 1. Check current state
cd C:\Users\admin\Documents\kondon
docker-compose up -d  # Start services

# 2. Test current registration (will fail)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { register(createUserDto: { email: \"test@test.com\", username: \"test\", password: \"test1234\" }) { access_token } }"}'

# 3. Document the exact error
# Expected: "Unknown argument \"createUserDto\" on field \"Mutation.register\""
```

### Phase 2: Apply Backend Fixes
```bash
# Fix resolver argument names
1. Update all @Args decorators to use 'input'
2. Ensure DTOs have proper GraphQL decorators
3. Regenerate schema if needed
4. Test backend in isolation
```

### Phase 3: Apply Frontend Fixes
```bash
# Update all GraphQL operations
1. Fix mutation argument names
2. Update field selections
3. Fix response handling
4. Update form submissions
```

### Phase 4: Browser Testing with MCP
```bash
# Run comprehensive browser tests
1. Start frontend and backend
2. Execute browser test suite
3. Capture screenshots of each step
4. Document any failures
```

### Phase 5: Self-QA Validation
```bash
# Run full QA suite
node scripts/test-auth-system.js

# Generate comprehensive report
node scripts/generate-qa-report.js
```

## Critical Success Metrics

### Must Pass Tests
1. **New user can register** - No GraphQL errors, user created in DB
2. **Existing user can login** - Receives valid JWT tokens
3. **Tokens work for protected routes** - Authorization header accepted
4. **Refresh token extends session** - New access token generated
5. **Logout clears session** - Tokens removed, routes protected again

### Performance Requirements
- Registration: < 2 seconds
- Login: < 1 second  
- Token refresh: < 500ms
- Protected route access: < 200ms

### Security Requirements
- Passwords hashed with bcrypt (min 10 rounds)
- JWT tokens properly signed
- SQL injection prevented
- XSS inputs sanitized
- Rate limiting enforced
- CORS properly configured

## Final Validation Script

```javascript
// scripts/final-validation.js

const chalk = require('chalk');
const { execSync } = require('child_process');

async function finalValidation() {
  console.log(chalk.blue.bold('\n🔍 FINAL AUTHENTICATION SYSTEM VALIDATION\n'));
  
  const validations = [
    {
      name: 'Backend Compilation',
      command: 'cd backend && npm run build',
      critical: true
    },
    {
      name: 'GraphQL Schema Valid',
      command: 'cd backend && npx graphql-inspector validate schema.gql',
      critical: true
    },
    {
      name: 'Frontend Compilation',
      command: 'cd frontend && npm run build',
      critical: true
    },
    {
      name: 'Database Migrations',
      command: 'cd backend && npm run migration:run',
      critical: true
    },
    {
      name: 'E2E Auth Tests',
      command: 'npm run test:auth:e2e',
      critical: true
    }
  ];
  
  let allPassed = true;
  
  for (const validation of validations) {
    try {
      console.log(chalk.yellow(`Running: ${validation.name}...`));
      execSync(validation.command, { stdio: 'pipe' });
      console.log(chalk.green(`✅ ${validation.name} passed`));
    } catch (error) {
      console.log(chalk.red(`❌ ${validation.name} failed`));
      if (validation.critical) {
        allPassed = false;
        console.log(chalk.red(`   Error: ${error.message}`));
      }
    }
  }
  
  if (allPassed) {
    console.log(chalk.green.bold('\n🎉 ALL VALIDATIONS PASSED! Authentication system is fully functional.\n'));
    
    // Run browser test for visual confirmation
    console.log(chalk.blue('Opening browser for visual confirmation...'));
    await runBrowserDemo();
  } else {
    console.log(chalk.red.bold('\n❌ VALIDATION FAILED! Please fix the issues above.\n'));
    process.exit(1);
  }
}

async function runBrowserDemo() {
  // Launch browser and demonstrate working auth
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Show registration working
  await page.goto('http://localhost:3000/auth/register');
  await page.fill('input[name="email"]', 'demo@example.com');
  await page.fill('input[name="username"]', 'demouser');
  await page.fill('input[name="password"]', 'DemoPass123!');
  await page.fill('input[name="fullName"]', 'Demo User');
  
  console.log(chalk.green('✅ Registration form filled - ready to submit'));
  await page.waitForTimeout(2000);
  
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 5000 });
  
  console.log(chalk.green('✅ Registration successful - user logged in!'));
  await page.waitForTimeout(3000);
  
  // Show logout
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/auth/login');
  
  console.log(chalk.green('✅ Logout successful'));
  await page.waitForTimeout(2000);
  
  // Show login working
  await page.fill('input[name="identifier"]', 'demo@example.com');
  await page.fill('input[name="password"]', 'DemoPass123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  console.log(chalk.green('✅ Login successful!'));
  console.log(chalk.green.bold('\n🎊 AUTHENTICATION SYSTEM FULLY OPERATIONAL! 🎊\n'));
  
  await page.waitForTimeout(3000);
  await browser.close();
}

// Run validation
finalValidation().catch(console.error);
```

## Usage Instructions for Claude Code

1. **Start with this exact prompt**:
   ```
   I need to systematically fix all GraphQL and authentication issues in the Kondon project at C:\Users\admin\Documents\kondon. 
   
   The main issue is that the register mutation is failing because the frontend sends 'createUserDto' but the backend expects 'input'.
   
   Please execute all 5 sub-agent tasks in order, using the browser MCP to validate that registration and login actually work in a real browser after fixes are applied.
   
   For each sub-agent, create the necessary fixes and test them before moving to the next phase.
   
   Use the Playwright MCP integration to perform actual browser testing and take screenshots of successful registration and login flows.
   
   The final deliverable should be a fully working authentication system with zero GraphQL errors.
   ```

2. **Claude Code will**:
   - Execute each sub-agent sequentially
   - Fix all GraphQL schema mismatches
   - Ensure auth flows work end-to-end
   - Use browser MCP to validate visually
   - Generate comprehensive test reports
   - Provide screenshots of working auth

3. **Success Criteria**:
   - User can register without errors
   - User can login without errors
   - JWT tokens are properly generated
   - Protected routes work correctly
   - All browser tests pass
   - Performance meets requirements

This comprehensive prompt ensures not just code fixes, but actual working authentication with real browser validation using MCP.