import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Vote } from '../entities/vote.entity';

@Resolver(() => Vote)
export class VoteResolver {
  // CamelCase field resolver for frontend compatibility
  @ResolveField(() => String, { name: 'voteType' })
  async voteType(@Parent() vote: Vote): Promise<string> {
    return vote.vote_type;
  }
}