import { Controller, Get, Param, Query } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { QueryResourcesDto } from './dto/query-resource.dto';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  findAll(@Query() query: QueryResourcesDto) {
    return this.resourcesService.findAll(query);
  }

  @Get('facets')
  getFacets(@Query() query: QueryResourcesDto) {
    return this.resourcesService.getFacets(query);
  }

  @Get(':id/related')
  getRelated(@Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.getRelatedResources(id);
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.findById(id);
  }
}
