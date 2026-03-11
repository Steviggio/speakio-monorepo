import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RoadmapsService } from './roadmaps.service';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { AddStepDto, AddSubStepDto, UpdateVocabularyDto } from './dto/add-step.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { UpdateSubStepDto } from './dto/update-substep.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../pipes/parse-objectid.pipe';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findMyRoadmaps(@Request() req: any) {
    return this.roadmapsService.findMyRoadmaps(req.user.userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats(@Request() req: any) {
    return this.roadmapsService.getUserStats(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.roadmapsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() createDto: CreateRoadmapDto) {
    return this.roadmapsService.create(createDto, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req: any, 
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateRoadmapDto
  ) {
    return this.roadmapsService.update(id, req.user.userId, updateDto);
  }

  @Patch(':id/steps/:stepIndex')
  @UseGuards(JwtAuthGuard)
  updateStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() updateDto: UpdateStepDto
  ) {
    return this.roadmapsService.updateStep(
      id,
      parseInt(stepIndex, 10),
      req.user.userId,
      updateDto
    );
  }

  @Patch(':id/steps/:stepIndex/toggle')
  @UseGuards(JwtAuthGuard)
  toggleStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
  ) {
    return this.roadmapsService.toggleStep(
      id,
      parseInt(stepIndex, 10),
      req.user.userId,
    );
  }

  @Post(':id/steps')
  @UseGuards(JwtAuthGuard)
  addStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: AddStepDto,
  ) {
    return this.roadmapsService.addStep(id, body, req.user.userId);
  }

  @Post(':id/steps/:stepIndex/substeps')
  @UseGuards(JwtAuthGuard)
  addSubStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() body: AddSubStepDto,
  ) {
    return this.roadmapsService.addSubStep(id, parseInt(stepIndex, 10), body, req.user.userId);
  }

  @Patch(':id/steps/:stepIndex/substeps/:subStepIndex')
  @UseGuards(JwtAuthGuard)
  updateSubStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Param('subStepIndex') subStepIndex: string,
    @Body() updateDto: UpdateSubStepDto
  ) {
    return this.roadmapsService.updateSubStep(
      id,
      parseInt(stepIndex, 10),
      parseInt(subStepIndex, 10),
      req.user.userId,
      updateDto
    );
  }

  @Delete(':id/steps/:stepIndex/substeps/:subStepIndex')
  @UseGuards(JwtAuthGuard)
  removeSubStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Param('subStepIndex') subStepIndex: string,
  ) {
    return this.roadmapsService.removeSubStep(
      id,
      parseInt(stepIndex, 10),
      parseInt(subStepIndex, 10),
      req.user.userId
    );
  }

  @Patch(':id/steps/:stepIndex/substeps/:subStepIndex/toggle')
  @UseGuards(JwtAuthGuard)
  toggleSubStep(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Param('subStepIndex') subStepIndex: string,
  ) {
    return this.roadmapsService.toggleSubStep(
      id,
      parseInt(stepIndex, 10),
      parseInt(subStepIndex, 10),
      req.user.userId,
    );
  }

  @Post(':id/steps/:stepIndex/vocabularies')
  @UseGuards(JwtAuthGuard)
  updateStepVocabularies(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Body() body: UpdateVocabularyDto,
  ) {
    return this.roadmapsService.updateVocabularies(id, req.user.userId, body, parseInt(stepIndex, 10));
  }

  @Post(':id/steps/:stepIndex/substeps/:subStepIndex/vocabularies')
  @UseGuards(JwtAuthGuard)
  updateSubStepVocabularies(
    @Request() req: any,
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('stepIndex') stepIndex: string,
    @Param('subStepIndex') subStepIndex: string,
    @Body() body: UpdateVocabularyDto,
  ) {
    return this.roadmapsService.updateVocabularies(
      id, 
      req.user.userId, 
      body, 
      parseInt(stepIndex, 10), 
      parseInt(subStepIndex, 10)
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string) {
    return this.roadmapsService.remove(id, req.user.userId);
  }

  @Post(':id/anki-export')
  @UseGuards(JwtAuthGuard)
  async exportToAnkiCsv(@Request() req: any, @Param('id', ParseObjectIdPipe) id: string, @Res() res: Response) {
    const csvString = await this.roadmapsService.exportToAnkiCsv(id, req.user.userId);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="anki-export-${id}.csv"`);
    
    return res.send(csvString);
  }
}
