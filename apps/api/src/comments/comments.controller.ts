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
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  findByTarget(
    @Query('targetType') targetType: 'Resource' | 'Post',
    @Query('targetId') targetId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.commentsService.findByTarget(targetType, targetId, pagination);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreateCommentDto) {
    return this.commentsService.create(createDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.commentsService.remove(id, req.user.userId, req.user.role);
  }
}
