import { Resolver, Query, Args } from '@nestjs/graphql';
import { Public } from '../auth/decorators/public.decorator';
import { SearchService } from './search.service';
import { SearchResultsDto } from './dto/search.dto';

@Resolver()
export class SearchResolver {
  constructor(private searchService: SearchService) {}

  @Public()
  @Query(() => SearchResultsDto)
  async search(
    @Args('query') query: string,
    @Args('type', { nullable: true }) type?: string,
  ): Promise<SearchResultsDto> {
    return this.searchService.search(query, type);
  }
}