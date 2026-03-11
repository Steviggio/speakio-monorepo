import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  toggleVote(@Request() req: any, @Body() createVoteDto: CreateVoteDto) {
    return this.votesService.toggleVote(
      req.user.userId,
      createVoteDto.resourceId,
      createVoteDto.type,
    );
  }

  @Get(':resourceId/me')
  @UseGuards(JwtAuthGuard)
  getMyVote(@Request() req: any, @Param('resourceId') resourceId: string) {
    return this.votesService.getUserVote(req.user.userId, resourceId);
  }
}
