import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './entities/answer.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../common/entities/vote.entity';
import { CreateAnswerDto, UpdateAnswerDto } from './dto/answers.dto';
import { OpenAI } from 'openai';

@Injectable()
export class AnswersService {
  private openai: OpenAI | null = null;

  constructor(
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async create(createAnswerDto: CreateAnswerDto, authorId: string): Promise<Answer> {
    const author = await this.userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const question = await this.questionRepository.findOne({ 
      where: { id: createAnswerDto.question_id },
      relations: ['author'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.status === 'closed') {
      throw new BadRequestException('Cannot answer a closed question');
    }

    // Generate embedding for the answer content
    const embedding = await this.generateEmbedding(createAnswerDto.content);

    const answer = this.answerRepository.create({
      content: createAnswerDto.content,
      author,
      question,
      content_embedding: embedding,
      is_accepted: false,
      is_ai_generated: false,
      quality_score: 0.5, // Default quality score
    });

    const savedAnswer = await this.answerRepository.save(answer);

    // Update question status to in_progress if it was open
    if (question.status === 'open') {
      await this.questionRepository.update(question.id, { status: 'in_progress' });
    }

    return savedAnswer;
  }

  async findById(id: string): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id },
      relations: ['author', 'question', 'question.author', 'votes', 'votes.user'],
    });

    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }

    return answer;
  }

  async findByQuestion(questionId: string): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { question: { id: questionId } },
      relations: ['author', 'votes', 'votes.user'],
      order: { is_accepted: 'DESC', created_at: 'ASC' },
    });
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto, userId: string): Promise<Answer> {
    const answer = await this.findById(id);

    if (answer.author.id !== userId) {
      throw new ForbiddenException('You can only edit your own answers');
    }

    // If content is being updated, regenerate embedding
    if (updateAnswerDto.content) {
      answer.content_embedding = await this.generateEmbedding(updateAnswerDto.content);
    }

    Object.assign(answer, updateAnswerDto);
    answer.updated_at = new Date();

    return this.answerRepository.save(answer);
  }

  async delete(id: string, userId: string): Promise<void> {
    const answer = await this.findById(id);

    if (answer.author.id !== userId) {
      throw new ForbiddenException('You can only delete your own answers');
    }

    if (answer.is_accepted) {
      throw new BadRequestException('Cannot delete an accepted answer');
    }

    await this.answerRepository.remove(answer);
  }

  async acceptAnswer(answerId: string, userId: string): Promise<Answer> {
    const answer = await this.findById(answerId);
    
    // Only question author can accept answers
    if (answer.question.author.id !== userId) {
      throw new ForbiddenException('Only the question author can accept answers');
    }

    // Unaccept any previously accepted answers for this question
    await this.answerRepository.update(
      { question: { id: answer.question.id } },
      { is_accepted: false }
    );

    // Accept this answer
    answer.is_accepted = true;
    const savedAnswer = await this.answerRepository.save(answer);

    // Update question status to resolved
    await this.questionRepository.update(answer.question.id, { status: 'resolved' });

    return savedAnswer;
  }

  async vote(answerId: string, userId: string, voteType: 'up' | 'down'): Promise<Vote> {
    const answer = await this.findById(answerId);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (answer.author.id === userId) {
      throw new BadRequestException('You cannot vote on your own answer');
    }

    // Check if user has already voted
    const existingVote = await this.voteRepository.findOne({
      where: { answer: { id: answerId }, user: { id: userId } },
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
      answer,
      vote_type: voteType,
    });

    return this.voteRepository.save(vote);
  }

  async getAnswersByUser(userId: string, page: number = 1, limit: number = 20): Promise<Answer[]> {
    return this.answerRepository.find({
      where: { author: { id: userId } },
      relations: ['author', 'question', 'votes'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
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