import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationEvent } from './entities/reputation-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReputationEvent])],
  providers: [],
  controllers: [],
  exports: [TypeOrmModule],
})
export class ReputationModule {}