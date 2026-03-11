import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /** Public: list comments for a target */
  @Get()
  findByTarget(
    @Query('targetType') targetType: 'Resource' | 'Post',
    @Query('targetId') targetId: string,
  ) {
    return this.commentsService.findByTarget(targetType, targetId);
  }

  /** Protected: create a comment */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreateCommentDto) {
    return this.commentsService.create(createDto, req.user.userId);
  }

  /** Protected: delete own comment */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.commentsService.remove(id, req.user.userId);
  }
}
