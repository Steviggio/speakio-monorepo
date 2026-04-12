import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.postsService.findAllPublished(query);
  }

  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMyPosts(@Request() req: any, @Query() query: PaginationDto) {
    return this.postsService.findMyPosts(req.user.userId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.postsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreatePostDto) {
    return this.postsService.create(createDto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdatePostDto,
  ) {
    return this.postsService.update(
      id,
      updateDto,
      req.user.userId,
      req.user.role,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.postsService.remove(id, req.user.userId, req.user.role);
  }
}
