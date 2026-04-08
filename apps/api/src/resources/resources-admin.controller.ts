import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ImportResourcesDto } from './dto/import-resources.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourcesService } from './resources.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/resources')
export class ResourcesAdminController {
  constructor(private readonly resourcesService: ResourcesService) { }

  @Post()
  create(@Body() dto: CreateResourceDto, @Request() req: any) {
    const userId = req.user?.userId ?? req.user?.sub ?? null;
    return this.resourcesService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateResourceDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.sub ?? null;
    const userRole = req.user?.role;
    return this.resourcesService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  remove(@Param('id', ParseObjectIdPipe) id: string, @Request() req: any) {
    const userId = req.user?.userId ?? req.user?.sub ?? null;
    const userRole = req.user?.role;
    return this.resourcesService.remove(id, userId, userRole);
  }

  @Post(':id/publish')
  publish(@Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.publish(id);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseObjectIdPipe) id: string) {
    return this.resourcesService.archive(id);
  }

  @Post('import')
  importBatch(@Body() dto: ImportResourcesDto, @Request() req: any) {
    const importedBy =
      req.user?.username ??
      req.user?.email ??
      req.user?.userId ??
      req.user?.sub ??
      'system';

    return this.resourcesService.importBatch(dto, importedBy);
  }
}