import { Injectable } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';
import { UsersService } from '../users/users.service';
import { SearchResultsDto } from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(
    private questionsService: QuestionsService,
    private usersService: UsersService,
  ) {}

  async search(query: string, type?: string): Promise<SearchResultsDto> {
    const results: SearchResultsDto = {};

    if (!type || type === 'questions') {
      try {
        results.questions = await this.questionsService.searchQuestions(query, 10);
      } catch (error) {
        results.questions = [];
      }
    }

    if (!type || type === 'users') {
      try {
        results.users = await this.usersService.searchUsers(query, 10);
      } catch (error) {
        results.users = [];
      }
    }

    if (!type || type === 'groups') {
      try {
        results.groups = await this.usersService.searchGroups(query, 10);
      } catch (error) {
        results.groups = [];
      }
    }

    // For answers, we can search through the questions service if needed
    if (!type || type === 'answers') {
      results.answers = [];
    }

    return results;
  }
}