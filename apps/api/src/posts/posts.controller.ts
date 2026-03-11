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

  /** Public: list published posts */
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.postsService.findAllPublished(query);
  }

  /** Public: get single post by slug */
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  /** Protected: list my posts (drafts + published) */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMyPosts(@Request() req: any) {
    return this.postsService.findMyPosts(req.user.userId);
  }

  /** Protected: get single post by id (for editing) */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.postsService.findById(id);
  }

  /** Protected: create a new post */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreatePostDto) {
    return this.postsService.create(createDto, req.user.userId);
  }

  /** Protected: update a post */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updateDto, req.user.userId);
  }

  /** Protected: delete a post */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.postsService.remove(id, req.user.userId);
  }
}
