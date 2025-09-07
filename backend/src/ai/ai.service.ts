import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAI } from 'openai';
import { SemanticRoute } from './entities/semantic-route.entity';
import { Question } from '../questions/entities/question.entity';
import { Answer } from '../answers/entities/answer.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../users/entities/group.entity';
import { UserGroupMembership } from '../users/entities/user-group-membership.entity';
import { GenerateAnswerDto, SemanticSearchDto, ExpertRoutingDto } from './dto/ai.dto';

interface VectorSimilarityResult {
  id: string;
  similarity: number;
  content: string;
  metadata?: any;
}

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_SEARCH_RESULTS = 20;

  constructor(
    @InjectRepository(SemanticRoute)
    private semanticRouteRepository: Repository<SemanticRoute>,
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private answerRepository: Repository<Answer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserGroupMembership)
    private membershipRepository: Repository<UserGroupMembership>,
  ) {
    // Only initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('OpenAI client initialized successfully in AiService');
      } catch (error) {
        console.warn('Failed to initialize OpenAI client in AiService:', error.message);
        this.openai = null;
      }
    } else {
      console.log('OpenAI API key not provided, running AiService in mock mode');
    }
  }

  async generateAnswer(generateDto: GenerateAnswerDto): Promise<{ answer: string; confidence: number; sources: any[] }> {
    try {
      const question = await this.questionRepository.findOne({
        where: { id: generateDto.question_id },
        relations: ['author', 'target_group'],
      });

      if (!question) {
        throw new BadRequestException('Question not found');
      }

      // If OpenAI client is not available, return a mock response
      if (!this.openai) {
        console.log('OpenAI client unavailable, returning mock answer for question:', question.id);
        
        const mockAnswer = `This is a mock answer generated for the question: "${question.title}"
        
The system would normally analyze this question and provide a comprehensive AI-generated response. However, the OpenAI API is currently not available.

Question details: ${question.content}

For a production system, this would include:
- Context from similar previous questions and answers
- Expert knowledge synthesis
- Practical examples and actionable advice
- Properly formatted markdown content

This mock response allows the system to continue functioning while the AI service is unavailable.`;

        return {
          answer: mockAnswer,
          confidence: 0.3, // Low confidence for mock answer
          sources: [],
        };
      }

      // Find similar questions and answers for context
      const similarContent = await this.findSimilarContent(
        `${question.title} ${question.content}`,
        5
      );

      // Build context from similar content
      const contextSources = [];
      let contextText = '';

      for (const similar of similarContent.slice(0, 3)) {
        if (similar.metadata?.type === 'answer') {
          contextText += `\nPrevious Answer (similarity: ${(similar.similarity * 100).toFixed(1)}%):\nQ: ${similar.metadata.question_title}\nA: ${similar.content}\n---`;
          contextSources.push({
            type: 'answer',
            id: similar.id,
            similarity: similar.similarity,
            title: similar.metadata.question_title,
          });
        }
      }

      // Create expert system prompt
      const systemPrompt = `You are an expert AI assistant helping users with technical questions in a Q&A platform. 
      
Your task is to provide comprehensive, accurate, and helpful answers based on:
1. The specific question asked
2. Available context from similar previous questions/answers
3. Your knowledge in the relevant domain

Guidelines:
- Be thorough but concise
- Include practical examples when relevant
- Acknowledge when you're uncertain
- Suggest follow-up questions if helpful
- Focus on actionable advice
- Use proper formatting with markdown

Context from similar questions:
${contextText || 'No similar content found.'}`;

      const userPrompt = `Question: ${question.title}

Details: ${question.content}

${question.target_group ? `Target Group: ${question.target_group.name}` : ''}

Please provide a comprehensive answer to this question.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const answer = completion.choices[0]?.message?.content;
      if (!answer) {
        throw new InternalServerErrorException('Failed to generate answer');
      }

      // Calculate confidence based on token usage and context quality
      const confidence = this.calculateAnswerConfidence(
        completion.usage?.total_tokens || 0,
        similarContent.length,
        similarContent[0]?.similarity || 0
      );

      return {
        answer,
        confidence,
        sources: contextSources,
      };
    } catch (error) {
      if (error.response?.status === 429) {
        throw new BadRequestException('AI service rate limit exceeded. Please try again later.');
      }
      throw new InternalServerErrorException(`AI answer generation failed: ${error.message}`);
    }
  }

  async semanticSearch(searchDto: SemanticSearchDto): Promise<VectorSimilarityResult[]> {
    try {
      // Generate embedding for search query
      const queryEmbedding = await this.generateEmbedding(searchDto.query);

      // Search questions
      let results: VectorSimilarityResult[] = [];

      if (searchDto.search_type === 'all' || searchDto.search_type === 'questions') {
        const questionResults = await this.searchQuestionsByEmbedding(
          queryEmbedding,
          searchDto.limit || 10
        );
        results.push(...questionResults);
      }

      // Search answers
      if (searchDto.search_type === 'all' || searchDto.search_type === 'answers') {
        const answerResults = await this.searchAnswersByEmbedding(
          queryEmbedding,
          searchDto.limit || 10
        );
        results.push(...answerResults);
      }

      // Sort by similarity and apply limit
      results.sort((a, b) => b.similarity - a.similarity);
      
      if (searchDto.limit) {
        results = results.slice(0, searchDto.limit);
      }

      // Filter by minimum similarity threshold
      results = results.filter(result => result.similarity >= (searchDto.min_similarity || 0.3));

      return results;
    } catch (error) {
      throw new InternalServerErrorException(`Semantic search failed: ${error.message}`);
    }
  }

  async routeToExperts(routingDto: ExpertRoutingDto): Promise<User[]> {
    try {
      const question = await this.questionRepository.findOne({
        where: { id: routingDto.question_id },
        relations: ['target_group'],
      });

      if (!question) {
        throw new BadRequestException('Question not found');
      }

      // Generate embedding for question content
      const questionEmbedding = await this.generateEmbedding(
        `${question.title} ${question.content}`
      );

      // Find experts based on multiple criteria
      let experts: User[] = [];

      // 1. If question has target group, get experts from that group
      if (question.target_group) {
        const groupExperts = await this.getExpertsFromGroup(
          question.target_group.id,
          routingDto.min_expertise_level || 3
        );
        experts.push(...groupExperts);
      }

      // 2. Find experts based on interests embedding similarity
      if (experts.length < (routingDto.max_experts || 5)) {
        const similarityExperts = await this.findExpertsByInterestSimilarity(
          questionEmbedding,
          routingDto.max_experts || 5
        );
        experts.push(...similarityExperts.filter(expert => 
          !experts.some(existing => existing.id === expert.id)
        ));
      }

      // 3. Sort by expertise score and reputation
      experts.sort((a, b) => {
        const scoreA = this.calculateExpertiseScore(a, question);
        const scoreB = this.calculateExpertiseScore(b, question);
        return scoreB - scoreA;
      });

      // Apply limits
      experts = experts.slice(0, routingDto.max_experts || 5);

      // Create semantic routing record
      await this.createSemanticRoute(question.id, experts.map(e => e.id), questionEmbedding);

      return experts;
    } catch (error) {
      throw new InternalServerErrorException(`Expert routing failed: ${error.message}`);
    }
  }

  async findSimilarQuestions(questionId: string, limit: number = 5): Promise<Question[]> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question || !question.content_embedding) {
      return [];
    }

    const similarities = await this.searchQuestionsByEmbedding(question.content_embedding, limit, [questionId]);
    
    // Extract question IDs and fetch full entities
    const questionIds = similarities.map(s => s.id);
    if (questionIds.length === 0) return [];
    
    return this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .whereInIds(questionIds)
      .getMany();
  }

  async findSimilarAnswers(answerId: string, limit: number = 5): Promise<Answer[]> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
    });

    if (!answer || !answer.content_embedding) {
      return [];
    }

    const similarities = await this.searchAnswersByEmbedding(answer.content_embedding, limit, [answerId]);
    
    // Extract answer IDs and fetch full entities
    const answerIds = similarities.map(s => s.id);
    if (answerIds.length === 0) return [];
    
    return this.answerRepository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.author', 'author')
      .leftJoinAndSelect('answer.question', 'question')
      .whereInIds(answerIds)
      .getMany();
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Return mock embedding when OpenAI client is not available
      console.log('OpenAI client unavailable, generating mock embedding');
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }

    try {
      const embedding = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text.substring(0, 8000), // Limit text length
      });
      
      return embedding.data[0].embedding;
    } catch (error) {
      console.warn('Failed to generate embedding, using mock data:', error.message);
      return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    }
  }

  private async findSimilarContent(query: string, limit: number): Promise<VectorSimilarityResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Search both questions and answers
    const questionResults = await this.searchQuestionsByEmbedding(queryEmbedding, limit);
    const answerResults = await this.searchAnswersByEmbedding(queryEmbedding, limit);
    
    // Combine and sort results
    const allResults = [...questionResults, ...answerResults];
    allResults.sort((a, b) => b.similarity - a.similarity);
    
    return allResults.slice(0, limit);
  }

  private async searchQuestionsByEmbedding(
    embedding: number[],
    limit: number,
    excludeIds: string[] = []
  ): Promise<VectorSimilarityResult[]> {
    // This is a simplified implementation
    // In a production system, you'd use a vector database like Pinecone, Weaviate, or pgvector
    const questions = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.author', 'author')
      .leftJoinAndSelect('question.target_group', 'target_group')
      .where('question.content_embedding IS NOT NULL')
      .andWhere(excludeIds.length > 0 ? 'question.id NOT IN (:...excludeIds)' : '1=1', { excludeIds })
      .limit(100) // Get more for filtering
      .getMany();

    const results: VectorSimilarityResult[] = [];

    for (const question of questions) {
      if (question.content_embedding) {
        const similarity = this.cosineSimilarity(embedding, question.content_embedding);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          results.push({
            id: question.id,
            similarity,
            content: `${question.title}\n${question.content}`,
            metadata: {
              type: 'question',
              title: question.title,
              author: question.author.username,
              group: question.target_group?.name,
            },
          });
        }
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  private async searchAnswersByEmbedding(
    embedding: number[],
    limit: number,
    excludeIds: string[] = []
  ): Promise<VectorSimilarityResult[]> {
    const answers = await this.answerRepository
      .createQueryBuilder('answer')
      .leftJoinAndSelect('answer.author', 'author')
      .leftJoinAndSelect('answer.question', 'question')
      .where('answer.content_embedding IS NOT NULL')
      .andWhere(excludeIds.length > 0 ? 'answer.id NOT IN (:...excludeIds)' : '1=1', { excludeIds })
      .limit(100)
      .getMany();

    const results: VectorSimilarityResult[] = [];

    for (const answer of answers) {
      if (answer.content_embedding) {
        const similarity = this.cosineSimilarity(embedding, answer.content_embedding);
        if (similarity >= this.SIMILARITY_THRESHOLD) {
          results.push({
            id: answer.id,
            similarity,
            content: answer.content,
            metadata: {
              type: 'answer',
              question_title: answer.question.title,
              author: answer.author.username,
              is_accepted: answer.is_accepted,
            },
          });
        }
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  private async getExpertsFromGroup(groupId: string, minExpertiseLevel: number): Promise<User[]> {
    const memberships = await this.membershipRepository.find({
      where: { 
        group: { id: groupId },
        expertise_level: minExpertiseLevel, // This needs proper comparison operator
      },
      relations: ['user'],
      order: { expertise_level: 'DESC' },
      take: 10,
    });

    return memberships.map(membership => membership.user);
  }

  private async findExpertsByInterestSimilarity(embedding: number[], limit: number): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { interests_embedding: 'IS NOT NULL' } as any, // TypeORM syntax
      take: 50,
    });

    const userSimilarities: { user: User; similarity: number }[] = [];

    for (const user of users) {
      if (user.interests_embedding) {
        const similarity = this.cosineSimilarity(embedding, user.interests_embedding);
        if (similarity >= 0.5) { // Lower threshold for user interests
          userSimilarities.push({ user, similarity });
        }
      }
    }

    return userSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.user);
  }

  private calculateExpertiseScore(user: User, question: Question): number {
    let score = user.reputation_score * 0.4; // 40% weight on reputation

    // Add group membership bonus
    if (user.group_memberships) {
      const relevantMembership = user.group_memberships.find(
        membership => membership.group.id === question.target_group?.id
      );
      if (relevantMembership) {
        score += relevantMembership.expertise_level * 20; // 20 points per expertise level
        if (relevantMembership.is_moderator) {
          score += 50; // Moderator bonus
        }
      }
    }

    return score;
  }

  private calculateAnswerConfidence(tokens: number, contextCount: number, maxSimilarity: number): number {
    let confidence = 0.5; // Base confidence

    // Higher token count usually means more comprehensive answer
    if (tokens > 500) confidence += 0.1;
    if (tokens > 1000) confidence += 0.1;

    // More context sources increase confidence
    confidence += Math.min(contextCount * 0.05, 0.2);

    // Higher similarity to existing content increases confidence
    confidence += maxSimilarity * 0.2;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private async createSemanticRoute(
    questionId: string,
    expertIds: string[],
    embedding: number[]
  ): Promise<SemanticRoute> {
    const semanticRoute = this.semanticRouteRepository.create({
      question: { id: questionId },
      expert_ids: expertIds,
      query_embedding: embedding,
      confidence_score: 0.8, // Default confidence
      route_reason: 'AI-powered expert matching based on semantic similarity',
    });

    return this.semanticRouteRepository.save(semanticRoute);
  }
}