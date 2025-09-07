import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import { OpenAI } from 'openai';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../users/entities/group.entity';
import { UserGroupMembership } from '../../users/entities/user-group-membership.entity';
import { Question } from '../../questions/entities/question.entity';
import { Answer } from '../../answers/entities/answer.entity';
import { ReputationEvent } from '../../reputation/entities/reputation-event.entity';
import { EscrowTransaction } from '../../payments/entities/escrow-transaction.entity';
import { Vote } from '../../common/entities/vote.entity';

@Injectable()
export class DatabaseSeeder {
  private openai: OpenAI;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserGroupMembership)
    private membershipRepository: Repository<UserGroupMembership>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(ReputationEvent)
    private reputationRepository: Repository<ReputationEvent>,
    @InjectRepository(EscrowTransaction)
    private escrowRepository: Repository<EscrowTransaction>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async seed() {
    console.log('🌱 Starting database seeding...');

    // Create 50 users with varied expertise
    const users = await this.createUsers(50);
    console.log(`✅ Created ${users.length} users`);
    
    // Create 10 groups with embeddings
    const groups = await this.createGroups([
      'Web Development', 'Data Science', 'DevOps', 
      'Mobile Development', 'AI/ML', 'Blockchain',
      'Security', 'Cloud Architecture', 'Database Design', 
      'System Design'
    ]);
    console.log(`✅ Created ${groups.length} groups`);
    
    // Create user-group memberships
    await this.createMemberships(users, groups);
    console.log('✅ Created user-group memberships');
    
    // Create 200 questions with bounties
    const questions = await this.createQuestions(200, users, groups);
    console.log(`✅ Created ${questions.length} questions`);
    
    // Create 500 answers with quality scores
    const answers = await this.createAnswers(500, questions, users);
    console.log(`✅ Created ${answers.length} answers`);
    
    // Create votes on questions and answers
    await this.createVotes(questions, answers, users);
    console.log('✅ Created votes');
    
    // Generate reputation events
    await this.generateReputationEvents(users);
    console.log('✅ Generated reputation events');
    
    // Create sample escrow transactions
    await this.createEscrowTransactions(questions);
    console.log('✅ Created escrow transactions');

    console.log('🎉 Database seeding completed successfully!');
  }

  private async createUsers(count: number): Promise<User[]> {
    const users: User[] = [];
    const saltRounds = 10;

    for (let i = 0; i < count; i++) {
      const hashedPassword = await bcrypt.hash('password123', saltRounds);
      
      const user = this.userRepository.create({
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password_hash: hashedPassword,
        full_name: faker.person.fullName(),
        bio: faker.person.bio(),
        avatar_url: faker.image.avatar(),
        reputation_score: faker.number.int({ min: 0, max: 10000 }),
        is_active: faker.datatype.boolean(0.95),
        email_verified: faker.datatype.boolean(0.8),
        stripe_customer_id: faker.datatype.boolean(0.3) ? faker.string.alphanumeric(18) : null,
        stripe_connect_account_id: faker.datatype.boolean(0.2) ? faker.string.alphanumeric(21) : null,
      });

      // Generate interests embedding
      const interests = faker.helpers.arrayElements([
        'javascript', 'python', 'react', 'node.js', 'machine learning',
        'blockchain', 'cloud computing', 'devops', 'mobile development',
        'data science', 'cybersecurity', 'ui/ux design'
      ], { min: 2, max: 5 });
      
      user.interests_embedding = await this.generateEmbedding(interests.join(' '));
      users.push(user);
    }

    return this.userRepository.save(users);
  }

  private async createGroups(groupNames: string[]): Promise<Group[]> {
    const groups: Group[] = [];

    for (const name of groupNames) {
      const description = `Expert group focused on ${name.toLowerCase()} topics and best practices.`;
      
      const group = this.groupRepository.create({
        name,
        description,
        category: faker.helpers.arrayElement(['Technology', 'Business', 'Science', 'Creative']),
        is_active: true,
        member_count: 0, // Will be updated when memberships are created
        embedding: await this.generateEmbedding(`${name} ${description}`),
      });

      groups.push(group);
    }

    return this.groupRepository.save(groups);
  }

  private async createMemberships(users: User[], groups: Group[]): Promise<void> {
    const memberships: UserGroupMembership[] = [];

    for (const user of users) {
      // Each user joins 1-4 groups
      const userGroups = faker.helpers.arrayElements(groups, { min: 1, max: 4 });
      
      for (const group of userGroups) {
        const membership = this.membershipRepository.create({
          user,
          group,
          expertise_level: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
          is_moderator: faker.datatype.boolean(0.1),
        });
        
        memberships.push(membership);
      }
    }

    await this.membershipRepository.save(memberships);

    // Update group member counts
    for (const group of groups) {
      const count = memberships.filter(m => m.group.id === group.id).length;
      await this.groupRepository.update(group.id, { member_count: count });
    }
  }

  private async createQuestions(count: number, users: User[], groups: Group[]): Promise<Question[]> {
    const questions: Question[] = [];

    for (let i = 0; i < count; i++) {
      const author = faker.helpers.arrayElement(users);
      const targetGroup = faker.helpers.arrayElement(groups);
      
      const title = this.generateQuestionTitle();
      const content = this.generateQuestionContent(title);
      
      const question = this.questionRepository.create({
        title,
        content,
        author,
        target_group: targetGroup,
        bounty_amount: faker.datatype.boolean(0.7) ? faker.number.int({ min: 10, max: 500 }) : 0,
        priority_level: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
        status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
        tags: faker.helpers.arrayElements([
          'javascript', 'typescript', 'react', 'node.js', 'python',
          'database', 'api', 'performance', 'security', 'testing'
        ], { min: 1, max: 4 }),
        view_count: faker.number.int({ min: 0, max: 1000 }),
        is_urgent: faker.datatype.boolean(0.15),
        content_embedding: await this.generateEmbedding(`${title} ${content}`),
      });

      questions.push(question);
    }

    return this.questionRepository.save(questions);
  }

  private async createAnswers(count: number, questions: Question[], users: User[]): Promise<Answer[]> {
    const answers: Answer[] = [];

    for (let i = 0; i < count; i++) {
      const question = faker.helpers.arrayElement(questions);
      const author = faker.helpers.arrayElement(users.filter(u => u.id !== question.author.id));
      
      const content = this.generateAnswerContent(question.title);
      
      const answer = this.answerRepository.create({
        content,
        author,
        question,
        quality_score: faker.number.float({ min: 0.1, max: 1.0, precision: 0.01 }),
        is_accepted: faker.datatype.boolean(0.2),
        is_ai_generated: faker.datatype.boolean(0.3),
        ai_confidence: faker.datatype.boolean(0.3) ? 
          faker.number.float({ min: 0.5, max: 0.98, precision: 0.01 }) : null,
        content_embedding: await this.generateEmbedding(content),
      });

      answers.push(answer);
    }

    return this.answerRepository.save(answers);
  }

  private async createVotes(questions: Question[], answers: Answer[], users: User[]): Promise<void> {
    const votes: Vote[] = [];

    // Vote on questions
    for (const question of questions) {
      const voterCount = faker.number.int({ min: 0, max: 20 });
      const voters = faker.helpers.arrayElements(users, voterCount);
      
      for (const voter of voters) {
        if (voter.id === question.author.id) continue;
        
        const vote = this.voteRepository.create({
          user: voter,
          question,
          vote_type: faker.helpers.arrayElement(['up', 'down']),
        });
        
        votes.push(vote);
      }
    }

    // Vote on answers
    for (const answer of answers) {
      const voterCount = faker.number.int({ min: 0, max: 15 });
      const voters = faker.helpers.arrayElements(users, voterCount);
      
      for (const voter of voters) {
        if (voter.id === answer.author.id) continue;
        
        const vote = this.voteRepository.create({
          user: voter,
          answer,
          vote_type: faker.helpers.arrayElement(['up', 'down']),
        });
        
        votes.push(vote);
      }
    }

    await this.voteRepository.save(votes);
  }

  private async generateReputationEvents(users: User[]): Promise<void> {
    const events: ReputationEvent[] = [];

    for (const user of users) {
      const eventCount = faker.number.int({ min: 5, max: 50 });
      
      for (let i = 0; i < eventCount; i++) {
        const event = this.reputationRepository.create({
          user,
          event_type: faker.helpers.arrayElement([
            'question_upvote', 'answer_upvote', 'answer_accepted',
            'question_downvote', 'answer_downvote', 'badge_earned'
          ]),
          points_change: faker.number.int({ min: -10, max: 50 }),
          description: faker.lorem.sentence(),
          created_at: faker.date.past({ years: 2 }),
        });
        
        events.push(event);
      }
    }

    await this.reputationRepository.save(events);
  }

  private async createEscrowTransactions(questions: Question[]): Promise<void> {
    const transactions: EscrowTransaction[] = [];
    
    const questionsWithBounty = questions.filter(q => q.bounty_amount > 0);
    
    for (const question of questionsWithBounty) {
      if (faker.datatype.boolean(0.4)) { // 40% of bounty questions have transactions
        const transaction = this.escrowRepository.create({
          payer_id: question.author.id,
          amount: question.bounty_amount,
          currency: 'USD',
          status: faker.helpers.arrayElement(['pending', 'held', 'released', 'refunded']),
          stripe_payment_intent_id: faker.string.alphanumeric(27),
          question_id: question.id,
          created_at: faker.date.past({ years: 1 }),
        });
        
        transactions.push(transaction);
      }
    }

    await this.escrowRepository.save(transactions);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Return mock embedding for development
        return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
      }

      const embedding = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });
      
      return embedding.data[0].embedding;
    } catch (error) {
      console.warn('Failed to generate embedding, using mock data:', error.message);
      // Return mock embedding if API fails
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }
  }

  private generateQuestionTitle(): string {
    const templates = [
      "How to implement {feature} in {technology}?",
      "Best practices for {concept} in {domain}?",
      "Why is my {technology} {problem}?",
      "What's the difference between {concept1} and {concept2}?",
      "Performance optimization for {technology} {feature}?",
    ];

    const template = faker.helpers.arrayElement(templates);
    
    return template
      .replace('{feature}', faker.helpers.arrayElement(['authentication', 'caching', 'routing', 'validation', 'testing']))
      .replace('{technology}', faker.helpers.arrayElement(['React', 'Node.js', 'Python', 'PostgreSQL', 'Redis']))
      .replace('{concept}', faker.helpers.arrayElement(['security', 'scalability', 'performance', 'maintainability']))
      .replace('{concept1}', 'REST')
      .replace('{concept2}', 'GraphQL')
      .replace('{domain}', faker.helpers.arrayElement(['web development', 'API design', 'database design']))
      .replace('{problem}', faker.helpers.arrayElement(['not working', 'slow', 'throwing errors', 'crashing']));
  }

  private generateQuestionContent(title: string): string {
    const contexts = [
      "I'm working on a project where I need to",
      "I've been struggling with",
      "Can someone help me understand",
      "I'm trying to optimize",
      "I've encountered an issue with",
    ];

    const context = faker.helpers.arrayElement(contexts);
    const details = faker.lorem.paragraphs(2);
    
    return `${context} ${title.toLowerCase().replace('?', '')}.\n\n${details}\n\nAny help would be greatly appreciated!`;
  }

  private generateAnswerContent(questionTitle: string): string {
    const starters = [
      "Here's how you can solve this:",
      "I've faced this issue before. Try this approach:",
      "The best way to handle this is:",
      "You can implement this using the following steps:",
      "Based on my experience, I'd recommend:",
    ];

    const starter = faker.helpers.arrayElement(starters);
    const solution = faker.lorem.paragraphs(faker.number.int({ min: 2, max: 4 }));
    
    return `${starter}\n\n${solution}\n\nHope this helps!`;
  }
}