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
import { ResourcesService } from './resources.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  findAll(@Query() query: QueryResourceDto) {
    return this.resourcesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreateResourceDto) {
    return this.resourcesService.create(createDto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateResourceDto,
  ) {
    return this.resourcesService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.remove(id, req.user.userId);
  }
}
