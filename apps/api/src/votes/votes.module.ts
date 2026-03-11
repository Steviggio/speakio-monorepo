import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vote, VoteSchema } from '../schemas/vote.schema';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { ResourcesModule } from '../resources/resources.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vote.name, schema: VoteSchema }]),
    ResourcesModule,
  ],
  controllers: [VotesController],
  providers: [VotesService],
  exports: [VotesService],
})
export class VotesModule {}
