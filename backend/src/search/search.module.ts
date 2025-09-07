import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [QuestionsModule, UsersModule],
  providers: [SearchService, SearchResolver],
})
export class SearchModule {}