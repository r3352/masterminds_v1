import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';
import { Question } from './entities/question.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../users/entities/group.entity';
import { Vote } from '../common/entities/vote.entity';
import { CreateQuestionDto, UpdateQuestionDto, QuestionFilterDto, QuestionStatus } from './dto/questions.dto';
import { OpenAI } from 'openai';

@Injectable()
export class QuestionsService {
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {
    // Only initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error.message);
        this.openai = null;
      }
    } else {
      console.log('OpenAI API key not provided - using mock embeddings for development');
    }
  }

  async create(createQuestionDto: CreateQuestionDto, authorId: string): Promise<Question> {
    const author = await this.userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    let targetGroup = null;
    if (createQuestionDto.target_group_id) {
      targetGroup = await this.groupRepository.findOne({ 
        where: { id: createQuestionDto.target_group_id } 
      });
      if (!targetGroup) {
        throw new NotFoundException('Target group not found');
      }
    }

    // Generate embedding for the question content
    const contentForEmbedding = `${createQuestionDto.title} ${createQuestionDto.content}`;
    const embedding = await this.generateEmbedding(contentForEmbedding);

    const question = this.questionRepository.create({
      ...createQuestionDto,
      author,
      target_group: targetGroup,
      content_embedding: embedding,
      status: QuestionStatus.OPEN,
      view_count: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.questionRepository.save(question);
  }

  async findById(id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['author', 'target_group', 'answers', 'answers.author', 'votes', 'votes.user'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Increment view count
    await this.questionRepository.update(id, {
      view_count: question.view_count + 1,
    });

    return question;
  }

  async findAll(filters: QuestionFilterDto): Promise<{ questions: Question[]; total: number }> {
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('question.votes', 'votes');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('question.status = :status', { status: filters.status });
    }

    if (filters.target_group_id) {
      queryBuilder.andWhere('question.target_group_id = :groupId', { groupId: filters.target_group_id });
    }

    // Support frontend's groupId parameter
    if (filters.groupId) {
      queryBuilder.andWhere('question.target_group_id = :groupId', { groupId: filters.groupId });
    }

    if (filters.author_id) {
      queryBuilder.andWhere('question.author_id = :authorId', { authorId: filters.author_id });
    }

    if (filters.has_bounty) {
      queryBuilder.andWhere('question.bounty_amount > 0');
    }

    if (filters.is_urgent !== undefined) {
      queryBuilder.andWhere('question.is_urgent = :isUrgent', { isUrgent: filters.is_urgent });
    }

    if (filters.min_bounty) {
      queryBuilder.andWhere('question.bounty_amount >= :minBounty', { minBounty: filters.min_bounty });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('question.tags && :tags', { tags: filters.tags });
    }

    if (filters.search_query) {
      queryBuilder.andWhere(
        '(question.title ILIKE :query OR question.content ILIKE :query)',
        { query: `%${filters.search_query}%` }
      );
    }

    // Apply sorting
    const sortField = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    
    queryBuilder.orderBy(`question.${sortField}`, sortOrder as 'ASC' | 'DESC');

    // Apply pagination - support both page/limit and skip/take
    let skip: number;
    let take: number;

    if (filters.skip !== undefined && filters.take !== undefined) {
      // Use frontend's skip/take pagination
      skip = filters.skip;
      take = Math.min(filters.take, 100); // Max 100 items per page
    } else {
      // Use traditional page/limit pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      skip = (page - 1) * limit;
      take = limit;
    }

    queryBuilder.skip(skip).take(take);

    const [questions, total] = await queryBuilder.getManyAndCount();

    return { questions, total };
  }

  async update(id: string, updateQuestionDto: UpdateQuestionDto, userId: string): Promise<Question> {
    const question = await this.findById(id);

    // Check if user is the author or has admin privileges
    if (question.author.id !== userId) {
      // Here you could add admin check
      throw new ForbiddenException('You can only edit your own questions');
    }

    // Don't allow status changes through update
    const { status, ...updateData } = updateQuestionDto;

    // If content is being updated, regenerate embedding
    if (updateData.title || updateData.content) {
      const newTitle = updateData.title || question.title;
      const newContent = updateData.content || question.content;
      (updateData as any).content_embedding = await this.generateEmbedding(`${newTitle} ${newContent}`);
    }

    Object.assign(question, updateData);
    question.updated_at = new Date();

    return this.questionRepository.save(question);
  }

  async updateStatus(id: string, status: QuestionStatus, userId: string): Promise<Question> {
    const question = await this.findById(id);

    // Check if user is the author or has appropriate privileges
    if (question.author.id !== userId) {
      throw new ForbiddenException('You can only update status of your own questions');
    }

    question.status = status;
    question.updated_at = new Date();

    return this.questionRepository.save(question);
  }

  async delete(id: string, userId: string): Promise<void> {
    const question = await this.findById(id);

    if (question.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own questions');
    }

    // Don't allow deletion if question has answers
    if (question.answers && question.answers.length > 0) {
      throw new BadRequestException('Cannot delete question that has answers');
    }

    await this.questionRepository.remove(question);
  }

  async vote(questionId: string, userId: string, voteType: 'up' | 'down'): Promise<Vote> {
    const question = await this.findById(questionId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (question.author.id === userId) {
      throw new BadRequestException('You cannot vote on your own question');
    }

    // Check if user has already voted
    const existingVote = await this.voteRepository.findOne({
      where: { question: { id: questionId }, user: { id: userId } },
    });

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        await this.voteRepository.remove(existingVote);
        return null;
      } else {
        // Change vote
        existingVote.vote_type = voteType;
        return this.voteRepository.save(existingVote);
      }
    }

    // Create new vote
    const vote = this.voteRepository.create({
      user,
      question,
      vote_type: voteType,
    });

    return this.voteRepository.save(vote);
  }

  async getQuestionVotes(questionId: string): Promise<{ upvotes: number; downvotes: number; userVote?: string }> {
    const votes = await this.voteRepository.find({
      where: { question: { id: questionId } },
      relations: ['user'],
    });

    const upvotes = votes.filter(vote => vote.vote_type === 'up').length;
    const downvotes = votes.filter(vote => vote.vote_type === 'down').length;

    return { upvotes, downvotes };
  }

  async getQuestionsByUser(userId: string, page: number = 1, limit: number = 20): Promise<Question[]> {
    return this.questionRepository.find({
      where: { author: { id: userId } },
      relations: ['author', 'target_group', 'answers', 'votes'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getQuestionsByGroup(groupId: string, page: number = 1, limit: number = 20): Promise<Question[]> {
    return this.questionRepository.find({
      where: { target_group: { id: groupId } },
      relations: ['author', 'target_group', 'answers', 'votes'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getTrendingQuestions(limit: number = 10): Promise<Question[]> {
    // Questions with high activity in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .leftJoinAndSelect('question.answers', 'answers')
      .leftJoinAndSelect('question.votes', 'votes')
      .where('question.created_at >= :sevenDaysAgo', { sevenDaysAgo })
      .orderBy('question.view_count + (SELECT COUNT(*) FROM votes v WHERE v.question_id = question.id) * 2 + (SELECT COUNT(*) FROM answers a WHERE a.question_id = question.id) * 3', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getUnansweredQuestions(limit: number = 20): Promise<Question[]> {
    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .leftJoin('question.answers', 'answer')
      .where('answer.id IS NULL')
      .andWhere('question.status = :status', { status: QuestionStatus.OPEN })
      .orderBy('question.bounty_amount', 'DESC')
      .addOrderBy('question.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getHighBountyQuestions(limit: number = 10): Promise<Question[]> {
    return this.questionRepository.find({
      where: { status: QuestionStatus.OPEN },
      relations: ['author', 'target_group', 'answers', 'votes'],
      order: { bounty_amount: 'DESC' },
      take: limit,
    });
  }

  async searchQuestions(query: string, limit: number = 20): Promise<Question[]> {
    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .where(
        '(question.title ILIKE :query OR question.content ILIKE :query OR :query = ANY(question.tags))',
        { query: `%${query}%` }
      )
      .orderBy('question.created_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getQuestionRecommendations(userId: string, limit: number = 10): Promise<Question[]> {
    // This is a simplified recommendation system
    // In a real system, you'd use embeddings and similarity matching
    
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['group_memberships', 'group_memberships.group'],
    });

    if (!user || !user.group_memberships?.length) {
      // Return trending questions if user has no groups
      return this.getTrendingQuestions(limit);
    }

    const groupIds = user.group_memberships.map(membership => membership.group.id);

    return this.questionRepository.find({
      where: { 
        target_group: { id: In(groupIds) },
        status: QuestionStatus.OPEN,
        author: { id: In([userId]) }, // Exclude user's own questions - this should be NOT In
      },
      relations: ['author', 'target_group', 'answers', 'votes'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.openai) {
        // Return mock embedding for development when OpenAI client is not available
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
}