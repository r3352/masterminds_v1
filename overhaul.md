Claude Code Comprehensive Implementation Prompt: Masterminds Q\&A Platform Full Development

Project Context \& Current State

You are tasked with completing the Masterminds Q\&A Platform located at C:\\Users\\admin\\Documents\\kondon. The project structure exists but 95% of functionality is missing. The application has:

we are on phase 3.

Static frontend UI with no functionality

Empty backend modules with only entity definitions

Well-designed database schema but no connectivity

Docker infrastructure that doesn't properly function



Mission Statement

Transform this skeleton project into a fully functional production-ready Q\&A platform with expert routing, bounty payments, AI-powered answers, and real-time features using Claude Code sub-agents for parallel development.

Sub-Agent Architecture \& Task Distribution

we are on phase 3.

💰 Agent 5: Payment \& Escrow Agent

Responsibility: Implement Stripe integration and escrow system

🤖 Agent 6: AI \& Search Agent

Responsibility: Implement OpenAI integration, embeddings, and semantic search

🚀 Agent 7: Real-time \& WebSocket Agent

Responsibility: Implement Socket.IO for live updates

🧪 Agent 8: Testing \& QA Agent

Responsibility: Write comprehensive tests and validate all features



Phase 3: Payment System (Agent 5)

Agent 5: Complete Stripe Integration \& Escrow

typescript// Task 1: Implement Escrow Service

// Location: backend/src/payments/escrow.service.ts

@Injectable()

export class EscrowService {

&nbsp; constructor(

&nbsp;   @InjectRepository(EscrowTransaction) 

&nbsp;   private escrowRepo: Repository<EscrowTransaction>,

&nbsp;   private stripe: Stripe,

&nbsp;   private fraudDetectionService: FraudDetectionService,

&nbsp; ) {

&nbsp;   this.stripe = new Stripe(process.env.STRIPE\_SECRET\_KEY, {

&nbsp;     apiVersion: '2023-10-16',

&nbsp;   });

&nbsp; }



&nbsp; async createEscrow(dto: CreateEscrowDto) {

&nbsp;   // Check for fraud patterns

&nbsp;   const fraudCheck = await this.fraudDetectionService.checkTransaction({

&nbsp;     payerId: dto.payerId,

&nbsp;     amount: dto.amount,

&nbsp;     questionId: dto.questionId,

&nbsp;   });

&nbsp;   

&nbsp;   if (fraudCheck.suspicious) {

&nbsp;     await this.flagForReview(dto, fraudCheck.reasons);

&nbsp;     throw new BadRequestException('Transaction flagged for review');

&nbsp;   }

&nbsp;   

&nbsp;   // Create payment intent with manual capture

&nbsp;   const paymentIntent = await this.stripe.paymentIntents.create({

&nbsp;     amount: dto.amount \* 100, // Convert to cents

&nbsp;     currency: 'usd',

&nbsp;     customer: dto.stripeCustomerId,

&nbsp;     capture\_method: 'manual',

&nbsp;     metadata: {

&nbsp;       questionId: dto.questionId,

&nbsp;       payerId: dto.payerId,

&nbsp;       type: 'bounty\_escrow',

&nbsp;     },

&nbsp;   });

&nbsp;   

&nbsp;   // Save escrow transaction

&nbsp;   const escrow = await this.escrowRepo.save({

&nbsp;     questionId: dto.questionId,

&nbsp;     payerId: dto.payerId,

&nbsp;     amount: dto.amount,

&nbsp;     platformFee: Math.floor(dto.amount \* 0.1), // 10% platform fee

&nbsp;     stripePaymentIntentId: paymentIntent.id,

&nbsp;     status: 'pending',

&nbsp;   });

&nbsp;   

&nbsp;   // Set expiration timer

&nbsp;   await this.scheduleEscrowExpiration(escrow.id, dto.slaHours);

&nbsp;   

&nbsp;   return {

&nbsp;     escrow,

&nbsp;     clientSecret: paymentIntent.client\_secret,

&nbsp;   };

&nbsp; }



&nbsp; async releaseEscrow(dto: ReleaseEscrowDto) {

&nbsp;   const escrow = await this.escrowRepo.findOne({

&nbsp;     where: { questionId: dto.questionId, status: 'held' },

&nbsp;   });

&nbsp;   

&nbsp;   if (!escrow) {

&nbsp;     throw new NotFoundException('No escrow found for this question');

&nbsp;   }

&nbsp;   

&nbsp;   // Get answerer's Stripe Connect account

&nbsp;   const answerer = await this.usersService.findById(dto.payeeId);

&nbsp;   if (!answerer.stripeConnectAccountId) {

&nbsp;     throw new BadRequestException('Answerer needs to set up payment account');

&nbsp;   }

&nbsp;   

&nbsp;   // Capture the payment

&nbsp;   await this.stripe.paymentIntents.capture(escrow.stripePaymentIntentId);

&nbsp;   

&nbsp;   // Transfer to answerer minus platform fee

&nbsp;   const transfer = await this.stripe.transfers.create({

&nbsp;     amount: (escrow.amount - escrow.platformFee) \* 100,

&nbsp;     currency: 'usd',

&nbsp;     destination: answerer.stripeConnectAccountId,

&nbsp;     metadata: {

&nbsp;       escrowId: escrow.id,

&nbsp;       questionId: dto.questionId,

&nbsp;       answerId: dto.answerId,

&nbsp;     },

&nbsp;   });

&nbsp;   

&nbsp;   // Update escrow status

&nbsp;   escrow.status = 'released';

&nbsp;   escrow.payeeId = dto.payeeId;

&nbsp;   escrow.stripeTransferId = transfer.id;

&nbsp;   escrow.releasedAt = new Date();

&nbsp;   await this.escrowRepo.save(escrow);

&nbsp;   

&nbsp;   // Send payment confirmation

&nbsp;   await this.emailService.sendPaymentConfirmation(answerer.email, escrow);

&nbsp;   

&nbsp;   return escrow;

&nbsp; }



&nbsp; async refundEscrow(escrowId: string, reason: string) {

&nbsp;   const escrow = await this.escrowRepo.findOne(escrowId);

&nbsp;   

&nbsp;   if (escrow.status !== 'held') {

&nbsp;     throw new BadRequestException('Can only refund held escrows');

&nbsp;   }

&nbsp;   

&nbsp;   // Cancel the payment intent

&nbsp;   await this.stripe.paymentIntents.cancel(escrow.stripePaymentIntentId);

&nbsp;   

&nbsp;   // Update escrow status

&nbsp;   escrow.status = 'refunded';

&nbsp;   escrow.refundedAt = new Date();

&nbsp;   await this.escrowRepo.save(escrow);

&nbsp;   

&nbsp;   // Notify payer

&nbsp;   await this.notificationService.notifyRefund(escrow.payerId, reason);

&nbsp;   

&nbsp;   return escrow;

&nbsp; }



&nbsp; // Fraud Detection Service

&nbsp; async detectCollusion(question: Question, answer: Answer) {

&nbsp;   const checks = await Promise.all(\[

&nbsp;     this.checkIPProximity(question.authorId, answer.authorId),

&nbsp;     this.checkTimingPatterns(question, answer),

&nbsp;     this.checkDeviceFingerprint(question.authorId, answer.authorId),

&nbsp;     this.checkAnswerSimilarity(question.id, answer.body),

&nbsp;     this.checkHistoricalPatterns(question.authorId, answer.authorId),

&nbsp;   ]);

&nbsp;   

&nbsp;   const suspiciousCount = checks.filter(c => c.suspicious).length;

&nbsp;   

&nbsp;   if (suspiciousCount >= 2) {

&nbsp;     await this.flagForManualReview({

&nbsp;       questionId: question.id,

&nbsp;       answerId: answer.id,

&nbsp;       reasons: checks.filter(c => c.suspicious).map(c => c.reason),

&nbsp;     });

&nbsp;     

&nbsp;     return { suspicious: true, confidence: suspiciousCount / checks.length };

&nbsp;   }

&nbsp;   

&nbsp;   return { suspicious: false };

&nbsp; }

}



// Task 2: Stripe Connect Onboarding

// Location: backend/src/payments/stripe-connect.service.ts

@Injectable()

export class StripeConnectService {

&nbsp; async onboardUser(userId: string) {

&nbsp;   const user = await this.usersService.findById(userId);

&nbsp;   

&nbsp;   // Create Connect account

&nbsp;   const account = await this.stripe.accounts.create({

&nbsp;     type: 'express',

&nbsp;     country: 'US',

&nbsp;     email: user.email,

&nbsp;     capabilities: {

&nbsp;       card\_payments: { requested: true },

&nbsp;       transfers: { requested: true },

&nbsp;     },

&nbsp;     metadata: {

&nbsp;       userId: user.id,

&nbsp;     },

&nbsp;   });

&nbsp;   

&nbsp;   // Generate onboarding link

&nbsp;   const accountLink = await this.stripe.accountLinks.create({

&nbsp;     account: account.id,

&nbsp;     refresh\_url: `${process.env.FRONTEND\_URL}/settings/payments`,

&nbsp;     return\_url: `${process.env.FRONTEND\_URL}/settings/payments/success`,

&nbsp;     type: 'account\_onboarding',

&nbsp;   });

&nbsp;   

&nbsp;   // Save Connect account ID

&nbsp;   user.stripeConnectAccountId = account.id;

&nbsp;   await this.usersService.update(user);

&nbsp;   

&nbsp;   return { onboardingUrl: accountLink.url };

&nbsp; }



&nbsp; async handleWebhook(signature: string, payload: Buffer) {

&nbsp;   const event = this.stripe.webhooks.constructEvent(

&nbsp;     payload,

&nbsp;     signature,

&nbsp;     process.env.STRIPE\_WEBHOOK\_SECRET,

&nbsp;   );

&nbsp;   

&nbsp;   switch (event.type) {

&nbsp;     case 'account.updated':

&nbsp;       await this.handleAccountUpdate(event.data.object);

&nbsp;       break;

&nbsp;     case 'payment\_intent.succeeded':

&nbsp;       await this.handlePaymentSuccess(event.data.object);

&nbsp;       break;

&nbsp;     case 'transfer.created':

&nbsp;       await this.handleTransferCreated(event.data.object);

&nbsp;       break;

&nbsp;   }

&nbsp; }

}



Phase 4: AI Integration (Agent 6)

Agent 6: OpenAI Integration \& Semantic Search

typescript// Task 1: AI Service for Answer Generation

// Location: backend/src/ai/ai.service.ts

@Injectable()

export class AIService {

&nbsp; private openai: OpenAI;

&nbsp; private knowledgeBase: VectorStore;

&nbsp; 

&nbsp; constructor(

&nbsp;   @InjectRepository(Question) private questionsRepo: Repository<Question>,

&nbsp;   @InjectRepository(Answer) private answersRepo: Repository<Answer>,

&nbsp;   private cacheManager: Cache,

&nbsp; ) {

&nbsp;   this.openai = new OpenAI({

&nbsp;     apiKey: process.env.OPENAI\_API\_KEY,

&nbsp;   });

&nbsp;   

&nbsp;   // Initialize vector store for RAG

&nbsp;   this.knowledgeBase = new PGVectorStore({

&nbsp;     connectionString: process.env.DATABASE\_URL,

&nbsp;     tableName: 'knowledge\_embeddings',

&nbsp;   });

&nbsp; }



&nbsp; async generateAIAnswer(questionId: string) {

&nbsp;   const question = await this.questionsRepo.findOne({

&nbsp;     where: { id: questionId },

&nbsp;     relations: \['group'],

&nbsp;   });

&nbsp;   

&nbsp;   // Retrieve relevant context using RAG

&nbsp;   const context = await this.retrieveContext(question);

&nbsp;   

&nbsp;   // Build enhanced prompt

&nbsp;   const prompt = this.buildRAGPrompt(question, context);

&nbsp;   

&nbsp;   // Generate answer using GPT-4

&nbsp;   const completion = await this.openai.chat.completions.create({

&nbsp;     model: 'gpt-4-turbo-preview',

&nbsp;     messages: \[

&nbsp;       {

&nbsp;         role: 'system',

&nbsp;         content: `You are an expert ${question.group?.name || 'technology'} assistant. 

&nbsp;                  Provide detailed, accurate answers with code examples when relevant.

&nbsp;                  Always cite sources and acknowledge limitations.`,

&nbsp;       },

&nbsp;       {

&nbsp;         role: 'user',

&nbsp;         content: prompt,

&nbsp;       },

&nbsp;     ],

&nbsp;     temperature: 0.7,

&nbsp;     max\_tokens: 2000,

&nbsp;   });

&nbsp;   

&nbsp;   const answerText = completion.choices\[0].message.content;

&nbsp;   

&nbsp;   // Validate code in answer

&nbsp;   const validatedAnswer = await this.validateAndFixCode(answerText);

&nbsp;   

&nbsp;   // Calculate confidence score

&nbsp;   const confidence = await this.calculateConfidence(question, validatedAnswer);

&nbsp;   

&nbsp;   // Save AI-generated answer

&nbsp;   const answer = await this.answersRepo.save({

&nbsp;     questionId,

&nbsp;     authorId: 'ai-system',

&nbsp;     body: validatedAnswer,

&nbsp;     isAiGenerated: true,

&nbsp;     aiConfidence: confidence,

&nbsp;     qualityScore: confidence \* 0.9, // Slightly lower than human experts

&nbsp;   });

&nbsp;   

&nbsp;   // Store in knowledge base for future RAG

&nbsp;   await this.updateKnowledgeBase(question, answer);

&nbsp;   

&nbsp;   return answer;

&nbsp; }



&nbsp; private async retrieveContext(question: Question) {

&nbsp;   // Get question embedding

&nbsp;   const embedding = question.embedding || 

&nbsp;     await this.generateEmbedding(`${question.title} ${question.body}`);

&nbsp;   

&nbsp;   // Search knowledge base

&nbsp;   const similarContent = await this.knowledgeBase.similaritySearch(

&nbsp;     embedding,

&nbsp;     5, // Top 5 results

&nbsp;   );

&nbsp;   

&nbsp;   // Search previous Q\&As

&nbsp;   const similarQuestions = await this.questionsRepo.query(`

&nbsp;     SELECT q.\*, a.body as accepted\_answer\_body

&nbsp;     FROM questions q

&nbsp;     JOIN answers a ON q.accepted\_answer\_id = a.id

&nbsp;     WHERE q.embedding IS NOT NULL

&nbsp;     ORDER BY q.embedding <=> $1::vector

&nbsp;     LIMIT 5

&nbsp;   `, \[embedding]);

&nbsp;   

&nbsp;   // Search documentation if available

&nbsp;   const docs = await this.searchDocumentation(question.tags);

&nbsp;   

&nbsp;   return {

&nbsp;     similarContent,

&nbsp;     similarQuestions,

&nbsp;     documentation: docs,

&nbsp;   };

&nbsp; }



&nbsp; private async validateAndFixCode(answer: string) {

&nbsp;   // Extract code blocks

&nbsp;   const codeBlocks = this.extractCodeBlocks(answer);

&nbsp;   

&nbsp;   for (const block of codeBlocks) {

&nbsp;     if (block.language === 'javascript' || block.language === 'typescript') {

&nbsp;       // Validate JavaScript/TypeScript

&nbsp;       try {

&nbsp;         await this.sandboxExecute(block.code);

&nbsp;       } catch (error) {

&nbsp;         // Fix common issues

&nbsp;         const fixedCode = await this.fixCodeWithAI(block.code, error);

&nbsp;         answer = answer.replace(block.code, fixedCode);

&nbsp;       }

&nbsp;     } else if (block.language === 'python') {

&nbsp;       // Validate Python

&nbsp;       const result = await this.validatePython(block.code);

&nbsp;       if (!result.valid) {

&nbsp;         const fixedCode = await this.fixCodeWithAI(block.code, result.error);

&nbsp;         answer = answer.replace(block.code, fixedCode);

&nbsp;       }

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   return answer;

&nbsp; }



&nbsp; async generateEmbedding(text: string): Promise<number\[]> {

&nbsp;   const response = await this.openai.embeddings.create({

&nbsp;     model: 'text-embedding-ada-002',

&nbsp;     input: text,

&nbsp;   });

&nbsp;   

&nbsp;   return response.data\[0].embedding;

&nbsp; }



&nbsp; // Semantic Router for User-Group Matching

&nbsp; async routeUserToGroups(user: User) {

&nbsp;   // Generate user interest embedding from profile

&nbsp;   const userEmbedding = await this.generateEmbedding(

&nbsp;     `${user.bio} ${user.interests?.join(' ')}`

&nbsp;   );

&nbsp;   

&nbsp;   // Find matching groups using cosine similarity

&nbsp;   const groups = await this.groupsRepo.query(`

&nbsp;     SELECT \*, 1 - (topic\_embedding <=> $1::vector) as similarity

&nbsp;     FROM groups

&nbsp;     WHERE topic\_embedding IS NOT NULL

&nbsp;     ORDER BY topic\_embedding <=> $1::vector

&nbsp;     LIMIT 10

&nbsp;   `, \[userEmbedding]);

&nbsp;   

&nbsp;   // Auto-join high confidence matches

&nbsp;   for (const group of groups) {

&nbsp;     if (group.similarity > 0.85) {

&nbsp;       await this.usersService.joinGroup(user.id, group.id);

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   return groups;

&nbsp; }

}



// Task 2: Implement Knowledge Base Management

// Location: backend/src/ai/knowledge-base.service.ts

@Injectable()

export class KnowledgeBaseService {

&nbsp; async indexDocumentation(docs: Documentation\[]) {

&nbsp;   for (const doc of docs) {

&nbsp;     // Split into chunks

&nbsp;     const chunks = this.splitIntoChunks(doc.content, 1000);

&nbsp;     

&nbsp;     for (const chunk of chunks) {

&nbsp;       // Generate embedding

&nbsp;       const embedding = await this.aiService.generateEmbedding(chunk.text);

&nbsp;       

&nbsp;       // Store in vector database

&nbsp;       await this.vectorStore.add({

&nbsp;         content: chunk.text,

&nbsp;         embedding,

&nbsp;         metadata: {

&nbsp;           source: doc.source,

&nbsp;           title: doc.title,

&nbsp;           section: chunk.section,

&nbsp;           url: doc.url,

&nbsp;         },

&nbsp;       });

&nbsp;     }

&nbsp;   }

&nbsp; }



&nbsp; async search(query: string, limit = 5) {

&nbsp;   const embedding = await this.aiService.generateEmbedding(query);

&nbsp;   

&nbsp;   return this.vectorStore.similaritySearch(embedding, limit);

&nbsp; }

}



Phase 5: Frontend Implementation (Agent 2)

Agent 2: Complete Frontend Features

typescript// Task 1: Implement Authentication Pages

// Location: frontend/src/app/(auth)/login/page.tsx

'use client';



import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation } from '@apollo/client';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';

import { LOGIN\_MUTATION } from '@/graphql/mutations';

import { useAuth } from '@/hooks/useAuth';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Alert } from '@/components/ui/alert';

import { Card } from '@/components/ui/card';

import { FcGoogle } from 'react-icons/fc';

import { FaGithub } from 'react-icons/fa';



const loginSchema = z.object({

&nbsp; email: z.string().email(),

&nbsp; password: z.string().min(8),

&nbsp; totpCode: z.string().optional(),

});



export default function LoginPage() {

&nbsp; const router = useRouter();

&nbsp; const { setAuth } = useAuth();

&nbsp; const \[error, setError] = useState('');

&nbsp; const \[requiresTwoFactor, setRequiresTwoFactor] = useState(false);

&nbsp; 

&nbsp; const \[login, { loading }] = useMutation(LOGIN\_MUTATION);

&nbsp; 

&nbsp; const { register, handleSubmit, formState: { errors } } = useForm({

&nbsp;   resolver: zodResolver(loginSchema),

&nbsp; });

&nbsp; 

&nbsp; const onSubmit = async (data: z.infer<typeof loginSchema>) => {

&nbsp;   try {

&nbsp;     const result = await login({ variables: { input: data } });

&nbsp;     

&nbsp;     if (result.data.login.requiresTwoFactor) {

&nbsp;       setRequiresTwoFactor(true);

&nbsp;       return;

&nbsp;     }

&nbsp;     

&nbsp;     // Store tokens

&nbsp;     localStorage.setItem('accessToken', result.data.login.accessToken);

&nbsp;     localStorage.setItem('refreshToken', result.data.login.refreshToken);

&nbsp;     

&nbsp;     // Update auth context

&nbsp;     setAuth({

&nbsp;       isAuthenticated: true,

&nbsp;       user: result.data.login.user,

&nbsp;     });

&nbsp;     

&nbsp;     // Redirect to dashboard

&nbsp;     router.push('/dashboard');

&nbsp;   } catch (err) {

&nbsp;     setError(err.message);

&nbsp;   }

&nbsp; };

&nbsp; 

&nbsp; const handleGoogleLogin = async () => {

&nbsp;   // Implement Google OAuth flow

&nbsp;   const response = await fetch('/api/auth/google');

&nbsp;   const { url } = await response.json();

&nbsp;   window.location.href = url;

&nbsp; };

&nbsp; 

&nbsp; return (

&nbsp;   <div className="min-h-screen flex items-center justify-center bg-gray-50">

&nbsp;     <Card className="w-full max-w-md p-8">

&nbsp;       <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

&nbsp;       

&nbsp;       {error \&\& (

&nbsp;         <Alert variant="destructive" className="mb-4">

&nbsp;           {error}

&nbsp;         </Alert>

&nbsp;       )}

&nbsp;       

&nbsp;       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

&nbsp;         <div>

&nbsp;           <Input

&nbsp;             type="email"

&nbsp;             placeholder="Email"

&nbsp;             {...register('email')}

&nbsp;             className={errors.email ? 'border-red-500' : ''}

&nbsp;           />

&nbsp;           {errors.email \&\& (

&nbsp;             <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>

&nbsp;           )}

&nbsp;         </div>

&nbsp;         

&nbsp;         <div>

&nbsp;           <Input

&nbsp;             type="password"

&nbsp;             placeholder="Password"

&nbsp;             {...register('password')}

&nbsp;             className={errors.password ? 'border-red-500' : ''}

&nbsp;           />

&nbsp;           {errors.password \&\& (

&nbsp;             <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>

&nbsp;           )}

&nbsp;         </div>

&nbsp;         

&nbsp;         {requiresTwoFactor \&\& (

&nbsp;           <div>

&nbsp;             <Input

&nbsp;               type="text"

&nbsp;               placeholder="2FA Code"

&nbsp;               {...register('totpCode')}

&nbsp;               maxLength={6}

&nbsp;             />

&nbsp;           </div>

&nbsp;         )}

&nbsp;         

&nbsp;         <Button type="submit" className="w-full" disabled={loading}>

&nbsp;           {loading ? 'Signing in...' : 'Sign In'}

&nbsp;         </Button>

&nbsp;       </form>

&nbsp;       

&nbsp;       <div className="mt-6">

&nbsp;         <div className="relative">

&nbsp;           <div className="absolute inset-0 flex items-center">

&nbsp;             <div className="w-full border-t border-gray-300" />

&nbsp;           </div>

&nbsp;           <div className="relative flex justify-center text-sm">

&nbsp;             <span className="px-2 bg-white text-gray-500">Or continue with</span>

&nbsp;           </div>

&nbsp;         </div>

&nbsp;         

&nbsp;         <div className="mt-6 grid grid-cols-2 gap-3">

&nbsp;           <Button

&nbsp;             variant="outline"

&nbsp;             onClick={handleGoogleLogin}

&nbsp;             className="w-full"

&nbsp;           >

&nbsp;             <FcGoogle className="mr-2 h-4 w-4" />

&nbsp;             Google

&nbsp;           </Button>

&nbsp;           

&nbsp;           <Button

&nbsp;             variant="outline"

&nbsp;             onClick={() => {/\* GitHub OAuth \*/}}

&nbsp;             className="w-full"

&nbsp;           >

&nbsp;             <FaGithub className="mr-2 h-4 w-4" />

&nbsp;             GitHub

&nbsp;           </Button>

&nbsp;         </div>

&nbsp;       </div>

&nbsp;       

&nbsp;       <p className="mt-6 text-center text-sm text-gray-600">

&nbsp;         Don't have an account?{' '}

&nbsp;         <Link href="/register" className="text-primary hover:underline">

&nbsp;           Sign up

&nbsp;         </Link>

&nbsp;       </p>

&nbsp;     </Card>

&nbsp;   </div>

&nbsp; );

}



// Task 2: Interactive Question Creation with Bounty

// Location: frontend/src/app/ask/page.tsx

'use client';



import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useMutation } from '@apollo/client';

import { CREATE\_QUESTION\_MUTATION } from '@/graphql/mutations';

import { RichTextEditor } from '@/components/editors/RichTextEditor';

import { TagInput } from '@/components/inputs/TagInput';

import { BountySelector } from '@/components/payments/BountySelector';

import { GroupSelector } from '@/components/selectors/GroupSelector';

import { Elements } from '@stripe/react-stripe-js';

import { loadStripe } from '@stripe/stripe-js';



const stripePromise = loadStripe(process.env.NEXT\_PUBLIC\_STRIPE\_KEY!);



export default function AskQuestionPage() {

&nbsp; const router = useRouter();

&nbsp; const \[createQuestion, { loading }] = useMutation(CREATE\_QUESTION\_MUTATION);

&nbsp; 

&nbsp; const \[formData, setFormData] = useState({

&nbsp;   title: '',

&nbsp;   body: '',

&nbsp;   tags: \[],

&nbsp;   bountyAmount: 0,

&nbsp;   slaHours: 24,

&nbsp;   groupId: null,

&nbsp; });

&nbsp; 

&nbsp; const \[showPayment, setShowPayment] = useState(false);

&nbsp; const \[paymentIntent, setPaymentIntent] = useState(null);

&nbsp; 

&nbsp; const handleSubmit = async () => {

&nbsp;   // Validate form

&nbsp;   if (!formData.title || !formData.body) {

&nbsp;     toast.error('Please fill in all required fields');

&nbsp;     return;

&nbsp;   }

&nbsp;   

&nbsp;   try {

&nbsp;     // Create question

&nbsp;     const result = await createQuestion({

&nbsp;       variables: { input: formData },

&nbsp;     });

&nbsp;     

&nbsp;     const question = result.data.createQuestion;

&nbsp;     

&nbsp;     // If bounty, show payment modal

&nbsp;     if (formData.bountyAmount > 0) {

&nbsp;       setPaymentIntent(question.escrow.clientSecret);

&nbsp;       setShowPayment(true);

&nbsp;     } else {

&nbsp;       // Redirect to question

&nbsp;       router.push(`/questions/${question.id}`);

&nbsp;     }

&nbsp;   } catch (error) {

&nbsp;     toast.error('Failed to create question');

&nbsp;   }

&nbsp; };

&nbsp; 

&nbsp; const handlePaymentSuccess = async () => {

&nbsp;   toast.success('Bounty payment confirmed!');

&nbsp;   router.push(`/questions/${questionId}`);

&nbsp; };

&nbsp; 

&nbsp; return (

&nbsp;   <div className="container mx-auto px-4 py-8 max-w-4xl">

&nbsp;     <Card>

&nbsp;       <CardHeader>

&nbsp;         <CardTitle>Ask a Question</CardTitle>

&nbsp;         <CardDescription>

&nbsp;           Get expert answers from our community. Add a bounty to incentivize faster, higher-quality responses.

&nbsp;         </CardDescription>

&nbsp;       </CardHeader>

&nbsp;       

&nbsp;       <CardContent className="space-y-6">

&nbsp;         {/\* Title Input \*/}

&nbsp;         <div>

&nbsp;           <Label htmlFor="title">Question Title \*</Label>

&nbsp;           <Input

&nbsp;             id="title"

&nbsp;             value={formData.title}

&nbsp;             onChange={(e) => setFormData({ ...formData, title: e.target.value })}

&nbsp;             placeholder="e.g., How to implement OAuth 2.0 in Node.js?"

&nbsp;             className="mt-2"

&nbsp;           />

&nbsp;           <p className="text-sm text-muted-foreground mt-1">

&nbsp;             Be specific and concise

&nbsp;           </p>

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* Rich Text Editor for Body \*/}

&nbsp;         <div>

&nbsp;           <Label>Question Details \*</Label>

&nbsp;           <RichTextEditor

&nbsp;             value={formData.body}

&nbsp;             onChange={(value) => setFormData({ ...formData, body: value })}

&nbsp;             placeholder="Provide detailed context, code samples, and what you've already tried..."

&nbsp;             features={\['code', 'image', 'link', 'list', 'quote']}

&nbsp;             className="mt-2 min-h-\[300px]"

&nbsp;           />

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* Tag Input \*/}

&nbsp;         <div>

&nbsp;           <Label>Tags</Label>

&nbsp;           <TagInput

&nbsp;             value={formData.tags}

&nbsp;             onChange={(tags) => setFormData({ ...formData, tags })}

&nbsp;             suggestions={popularTags}

&nbsp;             maxTags={5}

&nbsp;             className="mt-2"

&nbsp;           />

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* Group Selection \*/}

&nbsp;         <div>

&nbsp;           <Label>Target Group (Optional)</Label>

&nbsp;           <GroupSelector

&nbsp;             value={formData.groupId}

&nbsp;             onChange={(groupId) => setFormData({ ...formData, groupId })}

&nbsp;             className="mt-2"

&nbsp;           />

&nbsp;           <p className="text-sm text-muted-foreground mt-1">

&nbsp;             AI will auto-route if not specified

&nbsp;           </p>

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* Bounty Section \*/}

&nbsp;         <div className="border rounded-lg p-4 bg-gray-50">

&nbsp;           <div className="flex items-center justify-between mb-4">

&nbsp;             <div>

&nbsp;               <h3 className="font-medium">Add a Bounty (Optional)</h3>

&nbsp;               <p className="text-sm text-muted-foreground">

&nbsp;                 Incentivize experts with a monetary reward

&nbsp;               </p>

&nbsp;             </div>

&nbsp;             <Switch

&nbsp;               checked={formData.bountyAmount > 0}

&nbsp;               onCheckedChange={(checked) => {

&nbsp;                 if (!checked) setFormData({ ...formData, bountyAmount: 0 });

&nbsp;               }}

&nbsp;             />

&nbsp;           </div>

&nbsp;           

&nbsp;           {formData.bountyAmount > 0 \&\& (

&nbsp;             <BountySelector

&nbsp;               value={formData.bountyAmount}

&nbsp;               onChange={(amount) => setFormData({ ...formData, bountyAmount: amount })}

&nbsp;               minAmount={5}

&nbsp;               maxAmount={500}

&nbsp;             />

&nbsp;           )}

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* SLA Selection \*/}

&nbsp;         <div>

&nbsp;           <Label>Response SLA</Label>

&nbsp;           <Select

&nbsp;             value={formData.slaHours.toString()}

&nbsp;             onValueChange={(value) => setFormData({ ...formData, slaHours: parseInt(value) })}

&nbsp;           >

&nbsp;             <SelectTrigger className="mt-2">

&nbsp;               <SelectValue />

&nbsp;             </SelectTrigger>

&nbsp;             <SelectContent>

&nbsp;               <SelectItem value="24">24 hours (AI fallback)</SelectItem>

&nbsp;               <SelectItem value="48">48 hours</SelectItem>

&nbsp;               <SelectItem value="72">72 hours</SelectItem>

&nbsp;               <SelectItem value="168">1 week</SelectItem>

&nbsp;             </SelectContent>

&nbsp;           </Select>

&nbsp;         </div>

&nbsp;         

&nbsp;         {/\* Submit Button \*/}

&nbsp;         <div className="flex justify-end gap-4">

&nbsp;           <Button variant="outline" onClick={() => router.back()}>

&nbsp;             Cancel

&nbsp;           </Button>

&nbsp;           <Button onClick={handleSubmit} disabled={loading}>

&nbsp;             {loading ? 'Creating...' : formData.bountyAmount > 0 ? 'Continue to Payment' : 'Post Question'}

&nbsp;           </Button>

&nbsp;         </div>

&nbsp;       </CardContent>

&nbsp;     </Card>

&nbsp;     

&nbsp;     {/\* Stripe Payment Modal \*/}

&nbsp;     {showPayment \&\& paymentIntent \&\& (

&nbsp;       <Elements stripe={stripePromise}>

&nbsp;         <PaymentModal

&nbsp;           clientSecret={paymentIntent}

&nbsp;           amount={formData.bountyAmount}

&nbsp;           onSuccess={handlePaymentSuccess}

&nbsp;           onCancel={() => setShowPayment(false)}

&nbsp;         />

&nbsp;       </Elements>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}



// Task 3: Real-time Question Feed with Filters

// Location: frontend/src/app/questions/page.tsx

'use client';



import { useQuery, useSubscription } from '@apollo/client';

import { useState, useEffect } from 'react';

import { QUESTIONS\_QUERY, QUESTION\_CREATED\_SUBSCRIPTION } from '@/graphql/queries';

import { QuestionCard } from '@/components/questions/QuestionCard';

import { FilterPanel } from '@/components/filters/FilterPanel';

import { Pagination } from '@/components/ui/pagination';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

import { motion, AnimatePresence } from 'framer-motion';



export default function QuestionsPage() {

&nbsp; const \[filters, setFilters] = useState({

&nbsp;   status: 'all',

&nbsp;   hasBounty: false,

&nbsp;   tags: \[],

&nbsp;   groupId: null,

&nbsp;   sortBy: 'newest',

&nbsp; });

&nbsp; 

&nbsp; const \[page, setPage] = useState(1);

&nbsp; const \[questions, setQuestions] = useState(\[]);

&nbsp; 

&nbsp; const { data, loading, fetchMore } = useQuery(QUESTIONS\_QUERY, {

&nbsp;   variables: {

&nbsp;     filter: filters,

&nbsp;     pagination: { page, limit: 20 },

&nbsp;   },

&nbsp; });

&nbsp; 

&nbsp; // Subscribe to new questions

&nbsp; const { data: newQuestion } = useSubscription(QUESTION\_CREATED\_SUBSCRIPTION);

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   if (newQuestion) {

&nbsp;     setQuestions(prev => \[newQuestion.questionCreated, ...prev]);

&nbsp;     toast.info('New question posted!');

&nbsp;   }

&nbsp; }, \[newQuestion]);

&nbsp; 

&nbsp; // Infinite scroll

&nbsp; const { observerTarget } = useInfiniteScroll({

&nbsp;   loading,

&nbsp;   hasMore: data?.questions.hasMore,

&nbsp;   onLoadMore: () => fetchMore({

&nbsp;     variables: { pagination: { page: page + 1, limit: 20 } },

&nbsp;   }),

&nbsp; });

&nbsp; 

&nbsp; return (

&nbsp;   <div className="container mx-auto px-4 py-8">

&nbsp;     <div className="flex gap-8">

&nbsp;       {/\* Filters Sidebar \*/}

&nbsp;       <aside className="w-64 shrink-0">

&nbsp;         <FilterPanel

&nbsp;           filters={filters}

&nbsp;           onChange={setFilters}

&nbsp;           questionCount={data?.questions.total}

&nbsp;         />

&nbsp;       </aside>

&nbsp;       

&nbsp;       {/\* Questions List \*/}

&nbsp;       <main className="flex-1">

&nbsp;         <div className="flex justify-between items-center mb-6">

&nbsp;           <h1 className="text-2xl font-bold">

&nbsp;             {filters.hasBounty ? 'Bounty Questions' : 'All Questions'}

&nbsp;           </h1>

&nbsp;           

&nbsp;           <Select value={filters.sortBy} onValueChange={(value) => 

&nbsp;             setFilters({ ...filters, sortBy: value })

&nbsp;           }>

&nbsp;             <SelectTrigger className="w-\[180px]">

&nbsp;               <SelectValue />

&nbsp;             </SelectTrigger>

&nbsp;             <SelectContent>

&nbsp;               <SelectItem value="newest">Newest</SelectItem>

&nbsp;               <SelectItem value="bounty">Highest Bounty</SelectItem>

&nbsp;               <SelectItem value="votes">Most Votes</SelectItem>

&nbsp;               <SelectItem value="unanswered">Unanswered</SelectItem>

&nbsp;             </SelectContent>

&nbsp;           </Select>

&nbsp;         </div>

&nbsp;         

&nbsp;         {loading \&\& questions.length === 0 ? (

&nbsp;           <div className="space-y-4">

&nbsp;             {\[...Array(5)].map((\_, i) => (

&nbsp;               <Skeleton key={i} className="h-32" />

&nbsp;             ))}

&nbsp;           </div>

&nbsp;         ) : (

&nbsp;           <AnimatePresence>

&nbsp;             <div className="space-y-4">

&nbsp;               {questions.map((question) => (

&nbsp;                 <motion.div

&nbsp;                   key={question.id}

&nbsp;                   initial={{ opacity: 0, y: 20 }}

&nbsp;                   animate={{ opacity: 1, y: 0 }}

&nbsp;                   exit={{ opacity: 0, y: -20 }}

&nbsp;                   transition={{ duration: 0.2 }}

&nbsp;                 >

&nbsp;                   <QuestionCard

&nbsp;                     question={question}

&nbsp;                     showAuthor

&nbsp;                     showStats

&nbsp;                     showBounty

&nbsp;                   />

&nbsp;                 </motion.div>

&nbsp;               ))}

&nbsp;             </div>

&nbsp;           </AnimatePresence>

&nbsp;         )}

&nbsp;         

&nbsp;         {/\* Infinite scroll target \*/}

&nbsp;         <div ref={observerTarget} className="h-10" />

&nbsp;         

&nbsp;         {loading \&\& questions.length > 0 \&\& (

&nbsp;           <div className="flex justify-center py-4">

&nbsp;             <Spinner />

&nbsp;           </div>

&nbsp;         )}

&nbsp;       </main>

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}



Phase 6: Real-time Features (Agent 7)

Agent 7: WebSocket Implementation

typescript// Task 1: Socket.IO Gateway

// Location: backend/src/websockets/websocket.gateway.ts

@WebSocketGateway({

&nbsp; cors: {

&nbsp;   origin: process.env.FRONTEND\_URL,

&nbsp;   credentials: true,

&nbsp; },

&nbsp; namespace: '/realtime',

})

export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {

&nbsp; @WebSocketServer()

&nbsp; server: Server;

&nbsp; 

&nbsp; private connectedUsers = new Map<string, Socket>();

&nbsp; 

&nbsp; constructor(

&nbsp;   private jwtService: JwtService,

&nbsp;   private usersService: UsersService,

&nbsp; ) {}

&nbsp; 

&nbsp; async handleConnection(client: Socket) {

&nbsp;   try {

&nbsp;     // Authenticate socket connection

&nbsp;     const token = client.handshake.auth.token;

&nbsp;     const payload = this.jwtService.verify(token);

&nbsp;     const user = await this.usersService.findById(payload.sub);

&nbsp;     

&nbsp;     // Store user connection

&nbsp;     this.connectedUsers.set(user.id, client);

&nbsp;     client.data.userId = user.id;

&nbsp;     

&nbsp;     // Join user's groups

&nbsp;     const groups = await this.usersService.getUserGroups(user.id);

&nbsp;     groups.forEach(group => {

&nbsp;       client.join(`group:${group.id}`);

&nbsp;     });

&nbsp;     

&nbsp;     // Join personal room

&nbsp;     client.join(`user:${user.id}`);

&nbsp;     

&nbsp;     // Send connection confirmation

&nbsp;     client.emit('connected', {

&nbsp;       userId: user.id,

&nbsp;       groups: groups.map(g => g.id),

&nbsp;     });

&nbsp;     

&nbsp;     // Notify others user is online

&nbsp;     this.broadcastUserStatus(user.id, 'online');

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     client.emit('error', { message: 'Authentication failed' });

&nbsp;     client.disconnect();

&nbsp;   }

&nbsp; }

&nbsp; 

&nbsp; async handleDisconnect(client: Socket) {

&nbsp;   const userId = client.data.userId;

&nbsp;   if (userId) {

&nbsp;     this.connectedUsers.delete(userId);

&nbsp;     this.broadcastUserStatus(userId, 'offline');

&nbsp;   }

&nbsp; }

&nbsp; 

&nbsp; @SubscribeMessage('join-question')

&nbsp; async handleJoinQuestion(

&nbsp;   @MessageBody() data: { questionId: string },

&nbsp;   @ConnectedSocket() client: Socket,

&nbsp; ) {

&nbsp;   client.join(`question:${data.questionId}`);

&nbsp;   

&nbsp;   // Send current viewers count

&nbsp;   const room = this.server.sockets.adapter.rooms.get(`question:${data.questionId}`);

&nbsp;   this.server.to(`question:${data.questionId}`).emit('viewers-update', {

&nbsp;     questionId: data.questionId,

&nbsp;     viewers: room?.size || 0,

&nbsp;   });

&nbsp; }

&nbsp; 

&nbsp; @SubscribeMessage('typing')

&nbsp; async handleTyping(

&nbsp;   @MessageBody() data: { questionId: string, isTyping: boolean },

&nbsp;   @ConnectedSocket() client: Socket,

&nbsp; ) {

&nbsp;   const userId = client.data.userId;

&nbsp;   const user = await this.usersService.findById(userId);

&nbsp;   

&nbsp;   client.to(`question:${data.questionId}`).emit('user-typing', {

&nbsp;     userId,

&nbsp;     username: user.username,

&nbsp;     isTyping: data.isTyping,

&nbsp;   });

&nbsp; }

&nbsp; 

&nbsp; // Event handlers for real-time updates

&nbsp; @OnEvent('question.created')

&nbsp; handleQuestionCreated(question: Question) {

&nbsp;   // Notify relevant groups

&nbsp;   this.server.to(`group:${question.groupId}`).emit('new-question', question);

&nbsp;   

&nbsp;   // Notify users with matching interests

&nbsp;   this.notifyInterestedUsers(question);

&nbsp; }

&nbsp; 

&nbsp; @OnEvent('answer.created')

&nbsp; handleAnswerCreated(answer: Answer \& { question: Question }) {

&nbsp;   // Notify question author

&nbsp;   this.server.to(`user:${answer.question.authorId}`).emit('new-answer', {

&nbsp;     answerId: answer.id,

&nbsp;     questionId: answer.questionId,

&nbsp;     questionTitle: answer.question.title,

&nbsp;     authorName: answer.author.username,

&nbsp;   });

&nbsp;   

&nbsp;   // Notify question viewers

&nbsp;   this.server.to(`question:${answer.questionId}`).emit('answer-added', answer);

&nbsp; }

&nbsp; 

&nbsp; @OnEvent('question.voted')

&nbsp; handleQuestionVoted(data: { questionId: string, voteType: string }) {

&nbsp;   this.server.to(`question:${data.questionId}`).emit('vote-update', data);

&nbsp; }

&nbsp; 

&nbsp; @OnEvent('bounty.released')

&nbsp; handleBountyReleased(data: { questionId: string, answerId: string, amount: number }) {

&nbsp;   this.server.to(`question:${data.questionId}`).emit('bounty-released', data);

&nbsp; }

&nbsp; 

&nbsp; private async notifyInterestedUsers(question: Question) {

&nbsp;   // Find users with matching interests using vector similarity

&nbsp;   const interestedUsers = await this.usersService.findByInterests(

&nbsp;     question.embedding,

&nbsp;     0.8, // Similarity threshold

&nbsp;   );

&nbsp;   

&nbsp;   interestedUsers.forEach(user => {

&nbsp;     if (this.connectedUsers.has(user.id)) {

&nbsp;       this.server.to(`user:${user.id}`).emit('relevant-question', {

&nbsp;         question,

&nbsp;         relevanceScore: user.similarity,

&nbsp;       });

&nbsp;     }

&nbsp;   });

&nbsp; }

}



// Task 2: Frontend Socket Integration

// Location: frontend/src/hooks/useRealtime.ts

import { useEffect, useState } from 'react';

import { io, Socket } from 'socket.io-client';

import { useAuth } from './useAuth';

import { toast } from 'sonner';



export function useRealtime() {

&nbsp; const \[socket, setSocket] = useState<Socket | null>(null);

&nbsp; const \[isConnected, setIsConnected] = useState(false);

&nbsp; const { auth } = useAuth();

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   if (!auth?.accessToken) return;

&nbsp;   

&nbsp;   const newSocket = io(`${process.env.NEXT\_PUBLIC\_WS\_URL}/realtime`, {

&nbsp;     auth: {

&nbsp;       token: auth.accessToken,

&nbsp;     },

&nbsp;     transports: \['websocket'],

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('connect', () => {

&nbsp;     setIsConnected(true);

&nbsp;     console.log('Connected to realtime server');

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('disconnect', () => {

&nbsp;     setIsConnected(false);

&nbsp;     console.log('Disconnected from realtime server');

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('error', (error) => {

&nbsp;     console.error('Socket error:', error);

&nbsp;     toast.error('Connection error');

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('new-answer', (data) => {

&nbsp;     toast.info(`New answer on: ${data.questionTitle}`, {

&nbsp;       action: {

&nbsp;         label: 'View',

&nbsp;         onClick: () => window.location.href = `/questions/${data.questionId}`,

&nbsp;       },

&nbsp;     });

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('relevant-question', (data) => {

&nbsp;     toast.info('New question matching your interests!', {

&nbsp;       description: data.question.title,

&nbsp;       action: {

&nbsp;         label: 'View',

&nbsp;         onClick: () => window.location.href = `/questions/${data.question.id}`,

&nbsp;       },

&nbsp;     });

&nbsp;   });

&nbsp;   

&nbsp;   newSocket.on('bounty-released', (data) => {

&nbsp;     toast.success(`Bounty of $${data.amount} released!`);

&nbsp;   });

&nbsp;   

&nbsp;   setSocket(newSocket);

&nbsp;   

&nbsp;   return () => {

&nbsp;     newSocket.close();

&nbsp;   };

&nbsp; }, \[auth?.accessToken]);

&nbsp; 

&nbsp; return {

&nbsp;   socket,

&nbsp;   isConnected,

&nbsp;   

&nbsp;   joinQuestion: (questionId: string) => {

&nbsp;     socket?.emit('join-question', { questionId });

&nbsp;   },

&nbsp;   

&nbsp;   leaveQuestion: (questionId: string) => {

&nbsp;     socket?.emit('leave-question', { questionId });

&nbsp;   },

&nbsp;   

&nbsp;   sendTyping: (questionId: string, isTyping: boolean) => {

&nbsp;     socket?.emit('typing', { questionId, isTyping });

&nbsp;   },

&nbsp; };

}



// Task 3: Live Collaboration Features

// Location: frontend/src/components/realtime/LiveIndicators.tsx

export function LiveIndicators({ questionId }: { questionId: string }) {

&nbsp; const { socket } = useRealtime();

&nbsp; const \[viewers, setViewers] = useState(0);

&nbsp; const \[typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   if (!socket) return;

&nbsp;   

&nbsp;   socket.emit('join-question', { questionId });

&nbsp;   

&nbsp;   socket.on('viewers-update', (data) => {

&nbsp;     if (data.questionId === questionId) {

&nbsp;       setViewers(data.viewers);

&nbsp;     }

&nbsp;   });

&nbsp;   

&nbsp;   socket.on('user-typing', (data) => {

&nbsp;     if (data.isTyping) {

&nbsp;       setTypingUsers(prev => new Map(prev).set(data.userId, data.username));

&nbsp;     } else {

&nbsp;       setTypingUsers(prev => {

&nbsp;         const next = new Map(prev);

&nbsp;         next.delete(data.userId);

&nbsp;         return next;

&nbsp;       });

&nbsp;     }

&nbsp;     

&nbsp;     // Clear typing indicator after 3 seconds

&nbsp;     setTimeout(() => {

&nbsp;       setTypingUsers(prev => {

&nbsp;         const next = new Map(prev);

&nbsp;         next.delete(data.userId);

&nbsp;         return next;

&nbsp;       });

&nbsp;     }, 3000);

&nbsp;   });

&nbsp;   

&nbsp;   return () => {

&nbsp;     socket.emit('leave-question', { questionId });

&nbsp;     socket.off('viewers-update');

&nbsp;     socket.off('user-typing');

&nbsp;   };

&nbsp; }, \[socket, questionId]);

&nbsp; 

&nbsp; return (

&nbsp;   <div className="flex items-center gap-4 text-sm text-muted-foreground">

&nbsp;     {viewers > 0 \&\& (

&nbsp;       <div className="flex items-center gap-1">

&nbsp;         <Eye className="h-4 w-4" />

&nbsp;         <span>{viewers} viewing</span>

&nbsp;       </div>

&nbsp;     )}

&nbsp;     

&nbsp;     {typingUsers.size > 0 \&\& (

&nbsp;       <div className="flex items-center gap-1">

&nbsp;         <MessageSquare className="h-4 w-4 animate-pulse" />

&nbsp;         <span>

&nbsp;           {Array.from(typingUsers.values()).slice(0, 3).join(', ')}

&nbsp;           {typingUsers.size > 3 \&\& ` and ${typingUsers.size - 3} others`}

&nbsp;           {' '}typing...

&nbsp;         </span>

&nbsp;       </div>

&nbsp;     )}

&nbsp;   </div>

&nbsp; );

}



Phase 7: Testing \& Validation (Agent 8)

Agent 8: Comprehensive Testing Suite

typescript// Task 1: E2E Tests with Playwright

// Location: tests/e2e/question-flow.spec.ts

import { test, expect } from '@playwright/test';

import { createTestUser, createTestQuestion } from '../helpers';



test.describe('Question Flow E2E', () => {

&nbsp; test('Complete question lifecycle with bounty', async ({ page }) => {

&nbsp;   // Register and login

&nbsp;   const user = await createTestUser();

&nbsp;   await page.goto('/login');

&nbsp;   await page.fill('\[name="email"]', user.email);

&nbsp;   await page.fill('\[name="password"]', user.password);

&nbsp;   await page.click('button\[type="submit"]');

&nbsp;   

&nbsp;   // Navigate to ask question

&nbsp;   await page.click('text=Ask Question');

&nbsp;   

&nbsp;   // Fill question form

&nbsp;   await page.fill('\[name="title"]', 'How to implement WebSockets in Node.js?');

&nbsp;   await page.fill('.rich-text-editor', 'I need to implement real-time features...');

&nbsp;   

&nbsp;   // Add tags

&nbsp;   await page.fill('\[name="tags"]', 'node.js, websockets, real-time');

&nbsp;   

&nbsp;   // Set bounty

&nbsp;   await page.click('.bounty-switch');

&nbsp;   await page.fill('\[name="bountyAmount"]', '50');

&nbsp;   

&nbsp;   // Submit question

&nbsp;   await page.click('text=Continue to Payment');

&nbsp;   

&nbsp;   // Handle Stripe payment

&nbsp;   await page.waitForSelector('.stripe-payment-form');

&nbsp;   await page.fill('\[name="cardNumber"]', '4242424242424242');

&nbsp;   await page.fill('\[name="cardExpiry"]', '12/25');

&nbsp;   await page.fill('\[name="cardCvc"]', '123');

&nbsp;   await page.click('text=Pay $50');

&nbsp;   

&nbsp;   // Verify question created

&nbsp;   await page.waitForURL(/\\/questions\\/\[a-z0-9-]+/);

&nbsp;   await expect(page.locator('.question-title')).toContainText('How to implement WebSockets');

&nbsp;   await expect(page.locator('.bounty-badge')).toContainText('$50');

&nbsp;   

&nbsp;   // Submit answer

&nbsp;   await page.fill('.answer-editor', 'You can use Socket.IO...');

&nbsp;   await page.click('text=Submit Answer');

&nbsp;   

&nbsp;   // Verify answer appears

&nbsp;   await expect(page.locator('.answer-card')).toBeVisible();

&nbsp;   

&nbsp;   // Accept answer

&nbsp;   await page.click('text=Accept Answer');

&nbsp;   await page.click('text=Confirm');

&nbsp;   

&nbsp;   // Verify bounty released

&nbsp;   await expect(page.locator('.bounty-status')).toContainText('Released');

&nbsp; });

&nbsp; 

&nbsp; test('AI answer generation after SLA', async ({ page }) => {

&nbsp;   // Create question with 1 minute SLA for testing

&nbsp;   const question = await createTestQuestion({

&nbsp;     slaMinutes: 1,

&nbsp;     bountyAmount: 0,

&nbsp;   });

&nbsp;   

&nbsp;   // Wait for SLA to expire

&nbsp;   await page.waitForTimeout(65000);

&nbsp;   

&nbsp;   // Navigate to question

&nbsp;   await page.goto(`/questions/${question.id}`);

&nbsp;   

&nbsp;   // Verify AI answer exists

&nbsp;   await expect(page.locator('.ai-answer-badge')).toBeVisible();

&nbsp;   await expect(page.locator('.ai-answer-content')).toContainText('AI Generated');

&nbsp; });

});



// Task 2: Integration Tests

// Location: backend/src/questions/questions.service.spec.ts

describe('QuestionsService', () => {

&nbsp; let service: QuestionsService;

&nbsp; let module: TestingModule;

&nbsp; 

&nbsp; beforeEach(async () => {

&nbsp;   module = await Test.createTestingModule({

&nbsp;     imports: \[

&nbsp;       TypeOrmModule.forRoot({

&nbsp;         type: 'postgres',

&nbsp;         url: process.env.TEST\_DATABASE\_URL,

&nbsp;         synchronize: true,

&nbsp;       }),

&nbsp;       QuestionsModule,

&nbsp;     ],

&nbsp;   }).compile();

&nbsp;   

&nbsp;   service = module.get<QuestionsService>(QuestionsService);

&nbsp; });

&nbsp; 

&nbsp; describe('createQuestion', () => {

&nbsp;   it('should create question with embedding', async () => {

&nbsp;     const dto = {

&nbsp;       title: 'Test Question',

&nbsp;       body: 'Test body',

&nbsp;       tags: \['test'],

&nbsp;       bountyAmount: 50,

&nbsp;       slaHours: 24,

&nbsp;     };

&nbsp;     

&nbsp;     const question = await service.createQuestion(dto, 'user-id');

&nbsp;     

&nbsp;     expect(question).toBeDefined();

&nbsp;     expect(question.embedding).toHaveLength(1536);

&nbsp;     expect(question.bountyAmount).toBe(50);

&nbsp;     expect(question.slaDeadline).toBeDefined();

&nbsp;   });

&nbsp;   

&nbsp;   it('should auto-route to appropriate group', async () => {

&nbsp;     const dto = {

&nbsp;       title: 'React hooks best practices',

&nbsp;       body: 'What are the best practices for React hooks?',

&nbsp;       tags: \['react', 'javascript'],

&nbsp;     };

&nbsp;     

&nbsp;     const question = await service.createQuestion(dto, 'user-id');

&nbsp;     

&nbsp;     expect(question.group).toBeDefined();

&nbsp;     expect(question.group.name).toContain('Web Development');

&nbsp;   });

&nbsp;   

&nbsp;   it('should create escrow for bounty questions', async () => {

&nbsp;     const dto = {

&nbsp;       title: 'Test Bounty Question',

&nbsp;       body: 'Test body',

&nbsp;       bountyAmount: 100,

&nbsp;     };

&nbsp;     

&nbsp;     const question = await service.createQuestion(dto, 'user-id');

&nbsp;     const escrow = await service.getQuestionEscrow(question.id);

&nbsp;     

&nbsp;     expect(escrow).toBeDefined();

&nbsp;     expect(escrow.amount).toBe(100);

&nbsp;     expect(escrow.status).toBe('pending');

&nbsp;   });

&nbsp; });

&nbsp; 

&nbsp; describe('searchQuestions', () => {

&nbsp;   it('should perform hybrid search', async () => {

&nbsp;     // Create test questions

&nbsp;     await createTestQuestions(\[

&nbsp;       { title: 'JavaScript async/await', tags: \['javascript'] },

&nbsp;       { title: 'Python decorators', tags: \['python'] },

&nbsp;       { title: 'Async programming in JS', tags: \['javascript'] },

&nbsp;     ]);

&nbsp;     

&nbsp;     const results = await service.searchQuestions({

&nbsp;       query: 'async javascript',

&nbsp;       limit: 10,

&nbsp;     });

&nbsp;     

&nbsp;     expect(results).toHaveLength(2);

&nbsp;     expect(results\[0].title).toContain('async');

&nbsp;   });

&nbsp; });

});



// Task 3: Performance Tests

// Location: tests/performance/load-test.js

import http from 'k6/http';

import { check, sleep } from 'k6';



export const options = {

&nbsp; stages: \[

&nbsp;   { duration: '2m', target: 100 }, // Ramp up

&nbsp;   { duration: '5m', target: 100 }, // Stay at 100 users

&nbsp;   { duration: '2m', target: 200 }, // Ramp up more

&nbsp;   { duration: '5m', target: 200 }, // Stay at 200 users

&nbsp;   { duration: '2m', target: 0 },   // Ramp down

&nbsp; ],

&nbsp; thresholds: {

&nbsp;   http\_req\_duration: \['p(95)<500'], // 95% of requests under 500ms

&nbsp;   http\_req\_failed: \['rate<0.01'],   // Error rate under 1%

&nbsp; },

};



export default function () {

&nbsp; // Test question listing

&nbsp; let response = http.get('http://localhost:3001/api/questions');

&nbsp; check(response, {

&nbsp;   'status is 200': (r) => r.status === 200,

&nbsp;   'response time < 500ms': (r) => r.timings.duration < 500,

&nbsp; });

&nbsp; 

&nbsp; sleep(1);

&nbsp; 

&nbsp; // Test question search

&nbsp; response = http.get('http://localhost:3001/api/questions/search?q=javascript');

&nbsp; check(response, {

&nbsp;   'search status is 200': (r) => r.status === 200,

&nbsp;   'search has results': (r) => JSON.parse(r.body).length > 0,

&nbsp; });

&nbsp; 

&nbsp; sleep(1);

&nbsp; 

&nbsp; // Test WebSocket connection

&nbsp; const ws = http.ws('ws://localhost:3001/realtime');

&nbsp; ws.on('open', () => {

&nbsp;   ws.send(JSON.stringify({ event: 'join-question', data: { questionId: 'test-id' } }));

&nbsp; });

&nbsp; 

&nbsp; ws.on('message', (data) => {

&nbsp;   check(data, {

&nbsp;     'websocket message received': () => true,

&nbsp;   });

&nbsp; });

&nbsp; 

&nbsp; ws.setTimeout(() => {

&nbsp;   ws.close();

&nbsp; }, 5000);

}



Phase 8: Deployment \& Monitoring

Final Integration Tasks

yaml# Task 1: GitHub Actions CI/CD

\# Location: .github/workflows/deploy.yml

name: Deploy Masterminds Platform



on:

&nbsp; push:

&nbsp;   branches: \[main]

&nbsp; pull\_request:

&nbsp;   branches: \[main]



jobs:

&nbsp; test:

&nbsp;   runs-on: ubuntu-latest

&nbsp;   services:

&nbsp;     postgres:

&nbsp;       image: pgvector/pgvector:pg16

&nbsp;       env:

&nbsp;         POSTGRES\_PASSWORD: postgres

&nbsp;       options: >-

&nbsp;         --health-cmd pg\_isready

&nbsp;         --health-interval 10s

&nbsp;         --health-timeout 5s

&nbsp;         --health-retries 5

&nbsp;     redis:

&nbsp;       image: redis:7

&nbsp;       options: >-

&nbsp;         --health-cmd "redis-cli ping"

&nbsp;         --health-interval 10s

&nbsp;         --health-timeout 5s

&nbsp;         --health-retries 5



&nbsp;   steps:

&nbsp;     - uses: actions/checkout@v3

&nbsp;     

&nbsp;     - name: Setup Node.js

&nbsp;       uses: actions/setup-node@v3

&nbsp;       with:

&nbsp;         node-version: '18'

&nbsp;         

&nbsp;     - name: Install dependencies

&nbsp;       run: |

&nbsp;         cd backend \&\& npm ci

&nbsp;         cd ../frontend \&\& npm ci

&nbsp;         

&nbsp;     - name: Run backend tests

&nbsp;       run: |

&nbsp;         cd backend

&nbsp;         npm run test:cov

&nbsp;         

&nbsp;     - name: Run frontend tests

&nbsp;       run: |

&nbsp;         cd frontend

&nbsp;         npm run test

&nbsp;         

&nbsp;     - name: Run E2E tests

&nbsp;       run: |

&nbsp;         npx playwright install

&nbsp;         npm run test:e2e

&nbsp;         

&nbsp;     - name: Run performance tests

&nbsp;       run: |

&nbsp;         npm run test:performance



&nbsp; deploy:

&nbsp;   needs: test

&nbsp;   runs-on: ubuntu-latest

&nbsp;   if: github.ref == 'refs/heads/main'

&nbsp;   

&nbsp;   steps:

&nbsp;     - uses: actions/checkout@v3

&nbsp;     

&nbsp;     - name: Configure AWS credentials

&nbsp;       uses: aws-actions/configure-aws-credentials@v2

&nbsp;       with:

&nbsp;         aws-access-key-id: ${{ secrets.AWS\_ACCESS\_KEY\_ID }}

&nbsp;         aws-secret-access-key: ${{ secrets.AWS\_SECRET\_ACCESS\_KEY }}

&nbsp;         aws-region: us-east-1

&nbsp;         

&nbsp;     - name: Deploy to ECS

&nbsp;       run: |

&nbsp;         # Build and push Docker images

&nbsp;         docker build -t masterminds-backend ./backend

&nbsp;         docker build -t masterminds-frontend ./frontend

&nbsp;         

&nbsp;         # Push to ECR

&nbsp;         aws ecr get-login-password | docker login --username AWS --password-stdin $ECR\_URI

&nbsp;         docker tag masterminds-backend:latest $ECR\_URI/masterminds-backend:latest

&nbsp;         docker tag masterminds-frontend:latest $ECR\_URI/masterminds-frontend:latest

&nbsp;         docker push $ECR\_URI/masterminds-backend:latest

&nbsp;         docker push $ECR\_URI/masterminds-frontend:latest

&nbsp;         

&nbsp;         # Update ECS services

&nbsp;         aws ecs update-service --cluster masterminds --service backend --force-new-deployment

&nbsp;         aws ecs update-service --cluster masterminds --service frontend --force-new-deployment

&nbsp;         

&nbsp;     - name: Run database migrations

&nbsp;       run: |

&nbsp;         cd backend

&nbsp;         npm run typeorm migration:run

&nbsp;         

&nbsp;     - name: Invalidate CloudFront cache

&nbsp;       run: |

&nbsp;         aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT\_ID }} --paths "/\*"

typescript// Task 2: Monitoring \& Observability

// Location: backend/src/monitoring/monitoring.module.ts

import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { OpenTelemetryModule } from 'nestjs-otel';



@Module({

&nbsp; imports: \[

&nbsp;   PrometheusModule.register({

&nbsp;     path: '/metrics',

&nbsp;     defaultMetrics: {

&nbsp;       enabled: true,

&nbsp;     },

&nbsp;   }),

&nbsp;   OpenTelemetryModule.forRoot({

&nbsp;     metrics: {

&nbsp;       hostMetrics: true,

&nbsp;       apiMetrics: {

&nbsp;         enable: true,

&nbsp;       },

&nbsp;     },

&nbsp;     tracing: {

&nbsp;       enabled: true,

&nbsp;       exporter: {

&nbsp;         type: 'jaeger',

&nbsp;         options: {

&nbsp;           endpoint: process.env.JAEGER\_ENDPOINT,

&nbsp;         },

&nbsp;       },

&nbsp;     },

&nbsp;   }),

&nbsp; ],

&nbsp; providers: \[

&nbsp;   {

&nbsp;     provide: APP\_INTERCEPTOR,

&nbsp;     useClass: MetricsInterceptor,

&nbsp;   },

&nbsp;   {

&nbsp;     provide: APP\_INTERCEPTOR,

&nbsp;     useClass: TracingInterceptor,

&nbsp;   },

&nbsp; ],

})

export class MonitoringModule {}



Validation Checklist

bash#!/bin/bash

\# Location: scripts/validate-deployment.sh



echo "🔍 Validating Masterminds Platform Deployment..."



\# Check all services are running

check\_service() {

&nbsp; if curl -f $1 > /dev/null 2>\&1; then

&nbsp;   echo "✅ $2 is running"

&nbsp; else

&nbsp;   echo "❌ $2 is not responding"

&nbsp;   exit 1

&nbsp; fi

}



check\_service "http://localhost:3001/api/health" "Backend API"

check\_service "http://localhost:10021" "Frontend"

check\_service "http://localhost:5432" "PostgreSQL"

check\_service "http://localhost:6379" "Redis"



\# Run automated tests

echo "🧪 Running test suite..."

cd backend \&\& npm run test

cd ../frontend \&\& npm run test



\# Check GraphQL schema

echo "📊 Validating GraphQL schema..."

curl -X POST http://localhost:3001/graphql \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"query":"{ \_\_schema { types { name } } }"}' \\

&nbsp; | jq '.data.\_\_schema.types | length' > /dev/null



\# Test critical user flows

echo "🔄 Testing critical flows..."

npx playwright test tests/critical-flows.spec.ts



\# Check database migrations

echo "💾 Checking database state..."

cd backend \&\& npm run typeorm migration:show



\# Verify real-time connections

echo "🔌 Testing WebSocket connections..."

wscat -c ws://localhost:3001/realtime



echo "✨ All validations passed! Platform is ready for production."



Success Metrics

Upon completion, the platform will have:



✅ Full Authentication System - JWT, OAuth, 2FA

✅ Complete Question/Answer Flow - Create, vote, accept

✅ Working Payment System - Stripe escrow, payouts

✅ AI Integration - Answer generation, semantic search

✅ Real-time Features - Live updates via WebSockets

✅ Reputation System - PageRank algorithm, badges

✅ Search \& Discovery - Hybrid search, recommendations

✅ Responsive UI - Mobile-friendly, dark mode

✅ Performance - <2s page loads, 10k concurrent users

✅ Testing - >80% coverage, E2E tests

✅ Monitoring - Metrics, tracing, alerts

✅ Documentation - API docs, deployment guides



Execution Instructions



Initialize all sub-agents simultaneously for parallel development

Use the validation script after each phase to ensure quality

Commit changes after each successful component implementation

Run the full test suite before marking any phase complete

Deploy to staging after Phase 4, then production after Phase 

