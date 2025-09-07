# Comprehensive Claude Code Prompt for Route Testing & Question Flow Validation

## Project Context
You are working on the Kondon Q&A platform at `C:\Users\admin\Documents\kondon`. The authentication system is now working. Your task is to:
1. Login with test credentials
2. Test the complete question-asking flow
3. Identify and fix all route errors
4. Validate all user journeys using browser MCP

## Test Credentials
```json
{
  "email": "wskondon@gmail.com",
  "username": "wskondon",
  "password": "Password123!"
}
```

## Primary Objectives
1. **Login and validate authenticated routes work**
2. **Test complete question creation flow**
3. **Identify and fix all routing errors**
4. **Test answer submission and voting**
5. **Validate group/community features**
6. **Ensure bounty/payment flows work**
7. **Use browser MCP for end-to-end validation**

## Sub-Agent Task Distribution

### Sub-Agent 1: Route Discovery & Error Detective
**Role**: Map all routes and identify errors

**Tasks**:
1. **Frontend Route Mapping**
   ```bash
   # Scan frontend/src/app directory structure
   # Document all pages and their routes
   # Identify dynamic routes [id], [slug], etc.
   
   Expected routes to find:
   - /auth/login
   - /auth/register
   - /dashboard
   - /questions
   - /questions/new
   - /questions/[id]
   - /groups
   - /groups/[id]
   - /profile
   - /profile/[username]
   - /settings
   ```

2. **Route Configuration Analysis**
   ```typescript
   // Check frontend/src/app directory structure
   // Verify Next.js 13+ app router setup
   // Check for:
   - page.tsx files
   - layout.tsx files
   - loading.tsx files
   - error.tsx files
   - not-found.tsx files
   
   // Document issues like:
   - Missing page.tsx files
   - Incorrect file names
   - Missing layouts
   - Broken dynamic routes
   ```

3. **API Route Analysis**
   ```typescript
   // Check for API routes if any
   // frontend/src/app/api/*
   // Verify GraphQL endpoint configuration
   // Check Apollo Client setup
   ```

4. **Generate Route Error Report**
   ```markdown
   # Route Error Report
   
   ## Missing Routes
   - /questions/new - No page.tsx found
   - /groups/[id] - Dynamic route not configured
   
   ## Broken Links
   - Dashboard links to /questions/create (should be /questions/new)
   - Navigation uses wrong paths
   
   ## GraphQL Query Issues
   - Question detail page missing query
   - Groups list not fetching data
   ```

### Sub-Agent 2: Route Fixer & Page Creator
**Role**: Fix all routing issues and create missing pages

**Tasks**:
1. **Create Missing Question Pages**
   ```typescript
   // frontend/src/app/questions/new/page.tsx
   'use client';
   
   import { useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { useMutation } from '@apollo/client';
   import { CREATE_QUESTION_MUTATION } from '@/lib/graphql/questions';
   import { useAuth } from '@/contexts/AuthContext';
   
   export default function NewQuestionPage() {
     const router = useRouter();
     const { user } = useAuth();
     const [createQuestion, { loading, error }] = useMutation(CREATE_QUESTION_MUTATION);
     
     const [formData, setFormData] = useState({
       title: '',
       content: '',
       tags: [],
       bounty_amount: 0,
       is_urgent: false,
       target_group_id: null
     });
     
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       
       try {
         const { data } = await createQuestion({
           variables: {
             input: {
               title: formData.title,
               content: formData.content,
               tags: formData.tags,
               bounty_amount: formData.bounty_amount || null,
               is_urgent: formData.is_urgent,
               target_group_id: formData.target_group_id
             }
           }
         });
         
         // Redirect to question detail page
         router.push(`/questions/${data.createQuestion.id}`);
       } catch (err) {
         console.error('Error creating question:', err);
       }
     };
     
     if (!user) {
       router.push('/auth/login');
       return null;
     }
     
     return (
       <div className="container mx-auto p-4">
         <h1 className="text-2xl font-bold mb-4">Ask a Question</h1>
         
         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block mb-2">Title</label>
             <input
               type="text"
               value={formData.title}
               onChange={(e) => setFormData({...formData, title: e.target.value})}
               className="w-full p-2 border rounded"
               placeholder="What's your question?"
               required
             />
           </div>
           
           <div>
             <label className="block mb-2">Details</label>
             <textarea
               value={formData.content}
               onChange={(e) => setFormData({...formData, content: e.target.value})}
               className="w-full p-2 border rounded h-32"
               placeholder="Provide more context..."
               required
             />
           </div>
           
           <div>
             <label className="block mb-2">Tags (comma separated)</label>
             <input
               type="text"
               onChange={(e) => setFormData({
                 ...formData, 
                 tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
               })}
               className="w-full p-2 border rounded"
               placeholder="javascript, react, graphql"
             />
           </div>
           
           <div>
             <label className="block mb-2">
               <input
                 type="checkbox"
                 checked={formData.is_urgent}
                 onChange={(e) => setFormData({...formData, is_urgent: e.target.checked})}
                 className="mr-2"
               />
               Mark as urgent
             </label>
           </div>
           
           <div>
             <label className="block mb-2">Bounty Amount (optional)</label>
             <input
               type="number"
               value={formData.bounty_amount}
               onChange={(e) => setFormData({...formData, bounty_amount: parseInt(e.target.value) || 0})}
               className="w-full p-2 border rounded"
               min="0"
               placeholder="0"
             />
           </div>
           
           {error && (
             <div className="text-red-500 p-2 border border-red-500 rounded">
               Error: {error.message}
             </div>
           )}
           
           <button
             type="submit"
             disabled={loading}
             className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
           >
             {loading ? 'Posting...' : 'Post Question'}
           </button>
         </form>
       </div>
     );
   }
   ```

2. **Create Question Detail Page**
   ```typescript
   // frontend/src/app/questions/[id]/page.tsx
   'use client';
   
   import { useQuery, useMutation } from '@apollo/client';
   import { useParams } from 'next/navigation';
   import { GET_QUESTION_QUERY, CREATE_ANSWER_MUTATION } from '@/lib/graphql/questions';
   import { useState } from 'react';
   
   export default function QuestionDetailPage() {
     const params = useParams();
     const questionId = params.id as string;
     const [answerContent, setAnswerContent] = useState('');
     
     const { data, loading, error } = useQuery(GET_QUESTION_QUERY, {
       variables: { id: questionId }
     });
     
     const [createAnswer, { loading: answerLoading }] = useMutation(CREATE_ANSWER_MUTATION, {
       refetchQueries: [{ query: GET_QUESTION_QUERY, variables: { id: questionId } }]
     });
     
     const handleAnswerSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       try {
         await createAnswer({
           variables: {
             input: {
               question_id: questionId,
               content: answerContent
             }
           }
         });
         setAnswerContent('');
       } catch (err) {
         console.error('Error posting answer:', err);
       }
     };
     
     if (loading) return <div>Loading question...</div>;
     if (error) return <div>Error loading question: {error.message}</div>;
     if (!data?.question) return <div>Question not found</div>;
     
     const question = data.question;
     
     return (
       <div className="container mx-auto p-4">
         <div className="bg-white rounded-lg shadow p-6 mb-4">
           <h1 className="text-2xl font-bold mb-2">{question.title}</h1>
           <div className="text-gray-600 mb-4">
             Asked by {question.author.username} • {question.created_at}
           </div>
           <div className="prose max-w-none mb-4">
             {question.content}
           </div>
           <div className="flex gap-2 mb-4">
             {question.tags.map((tag: string) => (
               <span key={tag} className="bg-gray-200 px-2 py-1 rounded text-sm">
                 {tag}
               </span>
             ))}
           </div>
           {question.bounty_amount > 0 && (
             <div className="bg-yellow-100 p-2 rounded">
               💰 Bounty: ${question.bounty_amount}
             </div>
           )}
         </div>
         
         <div className="mb-4">
           <h2 className="text-xl font-bold mb-4">
             {question.answers.length} Answers
           </h2>
           {question.answers.map((answer: any) => (
             <div key={answer.id} className="bg-white rounded-lg shadow p-4 mb-4">
               <div className="prose max-w-none mb-2">
                 {answer.content}
               </div>
               <div className="text-gray-600 text-sm">
                 Answered by {answer.author.username} • {answer.created_at}
               </div>
             </div>
           ))}
         </div>
         
         <form onSubmit={handleAnswerSubmit} className="bg-white rounded-lg shadow p-4">
           <h3 className="font-bold mb-2">Your Answer</h3>
           <textarea
             value={answerContent}
             onChange={(e) => setAnswerContent(e.target.value)}
             className="w-full p-2 border rounded h-32 mb-2"
             placeholder="Write your answer..."
             required
           />
           <button
             type="submit"
             disabled={answerLoading}
             className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
           >
             {answerLoading ? 'Posting...' : 'Post Answer'}
           </button>
         </form>
       </div>
     );
   }
   ```

3. **Fix Navigation Components**
   ```typescript
   // frontend/src/components/Navigation.tsx
   
   const navigationItems = [
     { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
     { label: 'Questions', href: '/questions', requiresAuth: false },
     { label: 'Ask Question', href: '/questions/new', requiresAuth: true },
     { label: 'Groups', href: '/groups', requiresAuth: false },
     { label: 'Profile', href: '/profile', requiresAuth: true },
   ];
   ```

### Sub-Agent 3: GraphQL Query/Mutation Fixer
**Role**: Ensure all GraphQL operations for questions work

**Tasks**:
1. **Fix Question Queries/Mutations**
   ```typescript
   // frontend/src/lib/graphql/questions.ts
   
   import { gql } from '@apollo/client';
   
   export const CREATE_QUESTION_MUTATION = gql`
     mutation CreateQuestion($input: CreateQuestionDto!) {
       createQuestion(input: $input) {
         id
         title
         content
         tags
         bounty_amount
         is_urgent
         created_at
         author {
           id
           username
           avatar_url
         }
       }
     }
   `;
   
   export const GET_QUESTION_QUERY = gql`
     query GetQuestion($id: String!) {
       question(id: $id) {
         id
         title
         content
         tags
         bounty_amount
         is_urgent
         status
         created_at
         updated_at
         view_count
         upvotes
         downvotes
         author {
           id
           username
           avatar_url
           reputation_score
         }
         answers {
           id
           content
           created_at
           is_accepted
           upvotes
           downvotes
           author {
             id
             username
             avatar_url
             reputation_score
           }
         }
         target_group {
           id
           name
         }
       }
     }
   `;
   
   export const GET_QUESTIONS_QUERY = gql`
     query GetQuestions($filters: QuestionFilterDto) {
       questions(filters: $filters) {
         id
         title
         content
         tags
         bounty_amount
         status
         created_at
         view_count
         answerCount
         author {
           username
           avatar_url
         }
       }
     }
   `;
   
   export const CREATE_ANSWER_MUTATION = gql`
     mutation CreateAnswer($input: CreateAnswerDto!) {
       createAnswer(input: $input) {
         id
         content
         created_at
         author {
           id
           username
         }
       }
     }
   `;
   
   export const VOTE_QUESTION_MUTATION = gql`
     mutation VoteQuestion($questionId: String!, $voteType: String!) {
       voteQuestion(questionId: $questionId, voteType: $voteType) {
         id
         vote_type
       }
     }
   `;
   
   export const VOTE_ANSWER_MUTATION = gql`
     mutation VoteAnswer($answerId: String!, $voteType: String!) {
       voteAnswer(answerId: $answerId, voteType: $voteType) {
         id
         vote_type
       }
     }
   `;
   ```

### Sub-Agent 4: Browser Test Orchestrator (MCP)
**Role**: Use browser MCP to test complete user flows

**Tasks**:
1. **Login Test with Provided Credentials**
   ```javascript
   async function testLoginWithCredentials() {
     const browser = await mcp.playwright.launch({ 
       headless: false,
       slowMo: 500 // Slow down for visibility
     });
     const context = await browser.newContext();
     const page = await context.newPage();
     
     console.log('📝 Testing login with wskondon@gmail.com...');
     
     // Navigate to login
     await page.goto('http://localhost:3000/auth/login');
     await page.waitForSelector('input[name="identifier"]');
     
     // Fill login form
     await page.fill('input[name="identifier"]', 'wskondon@gmail.com');
     await page.fill('input[name="password"]', 'Password123!');
     
     // Take screenshot before login
     await page.screenshot({ path: 'screenshots/01-login-form.png' });
     
     // Monitor GraphQL request
     const responsePromise = page.waitForResponse(response => 
       response.url().includes('/graphql') && 
       response.request().postData()?.includes('login')
     );
     
     // Submit login
     await page.click('button[type="submit"]');
     
     // Check response
     const response = await responsePromise;
     const responseBody = await response.json();
     
     assert(!responseBody.errors, 'Login should not have GraphQL errors');
     assert(responseBody.data.login.access_token, 'Should receive access token');
     
     // Wait for redirect to dashboard
     await page.waitForURL('**/dashboard', { timeout: 5000 });
     await page.screenshot({ path: 'screenshots/02-dashboard.png' });
     
     console.log('✅ Login successful');
     
     // Store context for other tests
     return { browser, context, page };
   }
   ```

2. **Test Question Creation Flow**
   ```javascript
   async function testQuestionCreation(page) {
     console.log('📝 Testing question creation flow...');
     
     // Navigate to new question page
     await page.goto('http://localhost:3000/questions/new');
     
     // Check if page loads
     try {
       await page.waitForSelector('h1:has-text("Ask a Question")', { timeout: 5000 });
     } catch (error) {
       console.error('❌ /questions/new route not found or not loading');
       
       // Try to find the correct link
       await page.goto('http://localhost:3000/dashboard');
       const askButton = await page.locator('a:has-text("Ask Question"), button:has-text("Ask Question")');
       if (await askButton.count() > 0) {
         await askButton.first().click();
         await page.waitForLoadState('networkidle');
         console.log('Current URL:', page.url());
       }
     }
     
     await page.screenshot({ path: 'screenshots/03-new-question-page.png' });
     
     // Fill question form
     await page.fill('input[placeholder*="question"]', 'How do I implement authentication in GraphQL with NestJS?');
     await page.fill('textarea[placeholder*="context"]', 'I am building a full-stack application with NestJS backend and Next.js frontend. I need to implement JWT-based authentication for my GraphQL API. What are the best practices?');
     await page.fill('input[placeholder*="tags"]', 'nestjs, graphql, authentication, jwt');
     
     // Set bounty
     await page.fill('input[type="number"]', '50');
     
     // Mark as urgent
     const urgentCheckbox = await page.locator('input[type="checkbox"]');
     if (await urgentCheckbox.count() > 0) {
       await urgentCheckbox.first().check();
     }
     
     await page.screenshot({ path: 'screenshots/04-question-filled.png' });
     
     // Monitor GraphQL mutation
     const responsePromise = page.waitForResponse(response => 
       response.url().includes('/graphql') && 
       response.request().postData()?.includes('createQuestion')
     );
     
     // Submit question
     await page.click('button:has-text("Post Question")');
     
     // Check response
     try {
       const response = await responsePromise;
       const responseBody = await response.json();
       
       if (responseBody.errors) {
         console.error('❌ GraphQL errors:', responseBody.errors);
         return null;
       }
       
       const questionId = responseBody.data.createQuestion.id;
       console.log('✅ Question created with ID:', questionId);
       
       // Wait for redirect to question detail
       await page.waitForURL(`**/questions/${questionId}`, { timeout: 5000 });
       await page.screenshot({ path: 'screenshots/05-question-detail.png' });
       
       return questionId;
     } catch (error) {
       console.error('❌ Error creating question:', error);
       await page.screenshot({ path: 'screenshots/error-question-creation.png' });
       return null;
     }
   }
   ```

3. **Test Answer Submission**
   ```javascript
   async function testAnswerSubmission(page, questionId) {
     console.log('📝 Testing answer submission...');
     
     // Navigate to question if not already there
     if (!page.url().includes(`/questions/${questionId}`)) {
       await page.goto(`http://localhost:3000/questions/${questionId}`);
     }
     
     // Wait for answer form
     await page.waitForSelector('textarea[placeholder*="answer"]', { timeout: 5000 });
     
     // Write an answer
     const answerText = `To implement authentication in GraphQL with NestJS, follow these steps:
     
     1. Install required packages: @nestjs/jwt, @nestjs/passport, passport-jwt
     2. Create an AuthModule with JWT strategy
     3. Use Guards for protecting resolvers
     4. Store tokens securely on the frontend
     
     Here's a basic example of a JWT strategy...`;
     
     await page.fill('textarea[placeholder*="answer"]', answerText);
     await page.screenshot({ path: 'screenshots/06-answer-filled.png' });
     
     // Monitor GraphQL mutation
     const responsePromise = page.waitForResponse(response => 
       response.url().includes('/graphql') && 
       response.request().postData()?.includes('createAnswer')
     );
     
     // Submit answer
     await page.click('button:has-text("Post Answer")');
     
     try {
       const response = await responsePromise;
       const responseBody = await response.json();
       
       if (responseBody.errors) {
         console.error('❌ Answer submission errors:', responseBody.errors);
         return false;
       }
       
       console.log('✅ Answer posted successfully');
       await page.screenshot({ path: 'screenshots/07-answer-posted.png' });
       return true;
     } catch (error) {
       console.error('❌ Error posting answer:', error);
       return false;
     }
   }
   ```

4. **Test Navigation Routes**
   ```javascript
   async function testAllRoutes(page) {
     console.log('📝 Testing all navigation routes...');
     
     const routesToTest = [
       { path: '/dashboard', selector: 'h1:has-text("Dashboard")', name: 'Dashboard' },
       { path: '/questions', selector: 'h1:has-text("Questions")', name: 'Questions List' },
       { path: '/groups', selector: 'h1:has-text("Groups")', name: 'Groups' },
       { path: '/profile', selector: 'h1:has-text("Profile")', name: 'Profile' },
       { path: '/settings', selector: 'h1:has-text("Settings")', name: 'Settings' }
     ];
     
     const routeResults = [];
     
     for (const route of routesToTest) {
       try {
         console.log(`Testing route: ${route.path}`);
         await page.goto(`http://localhost:3000${route.path}`);
         
         // Check if we got redirected (might indicate auth issue)
         const currentUrl = page.url();
         if (currentUrl.includes('/auth/login')) {
           routeResults.push({
             ...route,
             status: 'REDIRECT_TO_LOGIN',
             error: 'Redirected to login - auth may be required'
           });
           
           // Re-login if needed
           await testLoginWithCredentials();
           await page.goto(`http://localhost:3000${route.path}`);
         }
         
         // Try to find expected content
         try {
           await page.waitForSelector(route.selector, { timeout: 3000 });
           routeResults.push({ ...route, status: 'SUCCESS' });
           await page.screenshot({ path: `screenshots/route-${route.name.toLowerCase().replace(' ', '-')}.png` });
         } catch {
           // Page loaded but selector not found
           routeResults.push({
             ...route,
             status: 'LOADED_BUT_CONTENT_MISSING',
             error: `Page loaded but selector "${route.selector}" not found`
           });
         }
         
       } catch (error) {
         routeResults.push({
           ...route,
           status: 'ERROR',
           error: error.message
         });
       }
     }
     
     // Print route test results
     console.log('\n📊 Route Test Results:');
     console.log('━'.repeat(50));
     
     routeResults.forEach(result => {
       const icon = result.status === 'SUCCESS' ? '✅' : '❌';
       console.log(`${icon} ${result.name} (${result.path}): ${result.status}`);
       if (result.error) {
         console.log(`   └─ ${result.error}`);
       }
     });
     
     return routeResults;
   }
   ```

5. **Test Group Features**
   ```javascript
   async function testGroupFeatures(page) {
     console.log('📝 Testing group features...');
     
     // Navigate to groups
     await page.goto('http://localhost:3000/groups');
     
     // Check if groups load
     const groupsExist = await page.locator('.group-card, [data-testid="group-item"]').count() > 0;
     
     if (!groupsExist) {
       console.log('No groups found, attempting to create one...');
       
       // Try to find create group button
       const createButton = await page.locator('button:has-text("Create Group"), a:has-text("Create Group")');
       if (await createButton.count() > 0) {
         await createButton.first().click();
         
         // Fill group creation form
         await page.fill('input[name="name"]', 'GraphQL Experts');
         await page.fill('textarea[name="description"]', 'A group for GraphQL enthusiasts and experts');
         await page.fill('input[name="category"]', 'Technology');
         
         await page.click('button:has-text("Create")');
         await page.waitForLoadState('networkidle');
       }
     }
     
     // Join a group
     const joinButton = await page.locator('button:has-text("Join")').first();
     if (await joinButton.count() > 0) {
       await joinButton.click();
       console.log('✅ Joined a group');
     }
     
     // Click on a group to view details
     const groupLink = await page.locator('a[href*="/groups/"]').first();
     if (await groupLink.count() > 0) {
       await groupLink.click();
       await page.waitForLoadState('networkidle');
       await page.screenshot({ path: 'screenshots/08-group-detail.png' });
     }
     
     return true;
   }
   ```

### Sub-Agent 5: Comprehensive QA Report Generator
**Role**: Generate detailed QA report with fixes

**Tasks**:
1. **Generate Comprehensive Test Report**
   ```javascript
   async function generateQAReport(testResults) {
     const report = {
       timestamp: new Date().toISOString(),
       environment: 'http://localhost:3000',
       user: 'wskondon@gmail.com',
       summary: {
         total_tests: 0,
         passed: 0,
         failed: 0,
         warnings: 0
       },
       sections: {
         authentication: {},
         questions: {},
         answers: {},
         routes: {},
         groups: {},
         performance: {}
       },
       errors_found: [],
       fixes_applied: [],
       recommendations: []
     };
     
     // Process test results
     // ... populate report
     
     // Generate markdown report
     const markdown = `
   # Kondon Platform QA Report
   
   ## Test Summary
   - **Date**: ${report.timestamp}
   - **User**: ${report.user}
   - **Total Tests**: ${report.summary.total_tests}
   - **Passed**: ${report.summary.passed} ✅
   - **Failed**: ${report.summary.failed} ❌
   - **Warnings**: ${report.summary.warnings} ⚠️
   
   ## Authentication Tests
   ${generateAuthSection(report.sections.authentication)}
   
   ## Question Flow Tests
   ${generateQuestionSection(report.sections.questions)}
   
   ## Route Tests
   ${generateRouteSection(report.sections.routes)}
   
   ## Errors Found & Fixed
   ${generateErrorSection(report.errors_found, report.fixes_applied)}
   
   ## Recommendations
   ${generateRecommendations(report.recommendations)}
   `;
     
     // Save report
     await fs.writeFile('qa-report.md', markdown);
     await fs.writeFile('qa-report.json', JSON.stringify(report, null, 2));
     
     console.log('📄 QA Report generated: qa-report.md');
     return report;
   }
   ```

2. **Fix Identification Script**
   ```javascript
   async function identifyAndDocumentFixes() {
     const fixes = [];
     
     // Check for common route issues
     const routeIssues = [
       {
         check: 'Missing page.tsx files',
         command: 'find frontend/src/app -type d -not -path "*/node_modules/*" -exec test ! -f {}/page.tsx \\; -print',
         fix: 'Create page.tsx file with proper export default function'
       },
       {
         check: 'Incorrect dynamic route syntax',
         pattern: /\[\.\.\..*\]/,
         fix: 'Use [...slug] for catch-all routes, [id] for single param'
       },
       {
         check: 'Missing error boundaries',
         fix: 'Add error.tsx files to handle route errors gracefully'
       },
       {
         check: 'GraphQL query errors',
         fix: 'Ensure all queries match backend schema exactly'
       }
     ];
     
     return fixes;
   }
   ```

## Complete Test Execution Flow

```javascript
// main-test-flow.js
const chalk = require('chalk');

async function runCompleteQAFlow() {
  console.log(chalk.blue.bold('\n🚀 STARTING COMPREHENSIVE QA TESTING\n'));
  console.log(chalk.yellow('User: wskondon@gmail.com\n'));
  
  const testFlow = [
    {
      name: 'Login with test credentials',
      fn: testLoginWithCredentials,
      critical: true
    },
    {
      name: 'Test question creation',
      fn: testQuestionCreation,
      critical: true
    },
    {
      name: 'Test answer submission',
      fn: testAnswerSubmission,
      critical: true
    },
    {
      name: 'Test all routes',
      fn: testAllRoutes,
      critical: false
    },
    {
      name: 'Test group features',
      fn: testGroupFeatures,
      critical: false
    },
    {
      name: 'Test voting system',
      fn: testVotingSystem,
      critical: false
    },
    {
      name: 'Test search functionality',
      fn: testSearch,
      critical: false
    },
    {
      name: 'Test user profile',
      fn: testUserProfile,
      critical: false
    }
  ];
  
  let context = null;
  const results = [];
  
  for (const test of testFlow) {
    console.log(chalk.cyan(`\n▶ ${test.name}...`));
    
    try {
      let result;
      
      if (test.name === 'Login with test credentials') {
        context = await test.fn();
        result = { success: true, context };
      } else if (context) {
        result = await test.fn(context.page);
      } else {
        throw new Error('No browser context available');
      }
      
      results.push({
        name: test.name,
        status: 'PASSED',
        result
      });
      
      console.log(chalk.green(`✅ ${test.name} - PASSED`));
      
    } catch (error) {
      results.push({
        name: test.name,
        status: 'FAILED',
        error: error.message
      });
      
      console.log(chalk.red(`❌ ${test.name} - FAILED`));
      console.log(chalk.red(`   Error: ${error.message}`));
      
      if (test.critical) {
        console.log(chalk.red.bold('\n⚠️  Critical test failed! Stopping execution.\n'));
        break;
      }
    }
  }
  
  // Generate final report
  await generateQAReport(results);
  
  // Show summary
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(chalk.blue.bold('\n📊 FINAL SUMMARY\n'));
  console.log(chalk.green(`Passed: ${passed}/${results.length}`));
  console.log(chalk.red(`Failed: ${failed}/${results.length}`));
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED! Platform is fully functional.\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Check qa-report.md for details.\n'));
  }
  
  // Close browser
  if (context) {
    await context.browser.close();
  }
}

// Run the complete flow
runCompleteQAFlow().catch(console.error);
```

## Route Error Fixes

### Common Route Errors and Solutions

1. **Missing /questions/new page**
   ```bash
   mkdir -p frontend/src/app/questions/new
   # Create page.tsx with the component code from Sub-Agent 2
   ```

2. **Dynamic route [id] not working**
   ```bash
   # Ensure folder structure is: frontend/src/app/questions/[id]/page.tsx
   # Not: frontend/src/app/questions/[questionId]/page.tsx
   ```

3. **Navigation 404 errors**
   ```typescript
   // Update all Link components to use correct paths
   <Link href="/questions/new">Ask Question</Link>
   // Not: <Link href="/question/create">
   ```

4. **Protected route issues**
   ```typescript
   // Add middleware for auth checking
   // frontend/src/middleware.ts
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('access_token');
     if (!token && protectedRoutes.includes(request.nextUrl.pathname)) {
       return NextResponse.redirect(new URL('/auth/login', request.url));
     }
   }
   ```

## Usage Instructions for Claude Code

```
Execute this comprehensive QA testing flow:

1. Start by logging in with credentials:
   - Email: wskondon@gmail.com
   - Password: Password123!

2. Test the complete question asking flow:
   - Navigate to new question page
   - Fill and submit question form
   - Verify question is created
   - Test answer submission

3. Identify and fix all route errors:
   - Document missing pages
   - Fix navigation links
   - Ensure dynamic routes work
   - Test protected routes

4. Use browser MCP (Playwright) to:
   - Take screenshots at each step
   - Monitor GraphQL requests
   - Validate UI elements load
   - Test user interactions

5. Generate comprehensive QA report with:
   - All errors found
   - Fixes applied
   - Screenshots of working features
   - Recommendations for improvements

The test should run in a visible browser window so we can see the actual user experience.
```

## Expected Outcomes

1. **Working Question Flow**: User can ask questions, view them, and submit answers
2. **Fixed Routes**: All navigation works without 404 errors
3. **Proper Auth**: Protected routes require login
4. **GraphQL Success**: All mutations/queries execute without errors
5. **Visual Proof**: Screenshots documenting the working system
6. **QA Report**: Comprehensive documentation of all tests and fixes

This prompt will systematically test your application as a real user would, identify route issues, and provide fixes while documenting everything with browser screenshots.