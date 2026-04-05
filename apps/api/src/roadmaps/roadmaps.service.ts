import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roadmap, RoadmapDocument } from '../schemas/roadmap.schema';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { CreateAnkiExportDto } from './dto/anki-export.dto';
import { AddStepDto, AddSubStepDto, UpdateVocabularyDto } from './dto/add-step.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { UpdateSubStepDto } from './dto/update-substep.dto';

@Injectable()
export class RoadmapsService {
  constructor(
    @InjectModel(Roadmap.name) private roadmapModel: Model<RoadmapDocument>,
  ) {}

  async create(createDto: CreateRoadmapDto, userId: string): Promise<RoadmapDocument> {
    const steps = (createDto.steps || []).map((s) => ({
      ...s,
      completed: false,
    }));
    const roadmap = new this.roadmapModel({
      ...createDto,
      steps,
      owner: userId,
    });
    return roadmap.save();
  }

  async findMyRoadmaps(userId: string): Promise<RoadmapDocument[]> {
    return this.roadmapModel
      .find({ owner: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel
      .findById(id)
      .populate('owner', 'username avatarUrl')
      .exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    return roadmap;
  }

  async update(id: string, userId: string, updateDto: UpdateRoadmapDto): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findOneAndUpdate(
      { _id: id, owner: userId },
      { $set: updateDto },
      { new: true }
    ).exec();

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found or unauthorized');
    }

    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateStep(
    roadmapId: string,
    stepIndex: number,
    userId: string,
    updateDto: UpdateStepDto
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(roadmapId).exec();
    
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');

    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) {
      throw new NotFoundException('Step not found');
    }

    const step = roadmap.steps[stepIndex];
    if (updateDto.title !== undefined) step.title = updateDto.title;
    if (updateDto.description !== undefined) step.description = updateDto.description;
    
    if (updateDto.deadline !== undefined) {
      step.deadline = updateDto.deadline ? new Date(updateDto.deadline) : undefined;
    }

    if (updateDto.completed !== undefined) {
      step.completed = updateDto.completed;
      step.completedAt = step.completed ? new Date() : undefined;
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async toggleStep(id: string, stepIndex: number, userId: string): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) {
      throw new NotFoundException('Step not found');
    }

    const step = roadmap.steps[stepIndex];
    step.completed = !step.completed;
    step.completedAt = step.completed ? new Date() : undefined;
    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async addStep(id: string, dto: AddStepDto, userId: string): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    
    roadmap.steps.push({
      title: dto.title,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      vocabularies: dto.vocabularies || [],
      subSteps: [],
      completed: false
    } as any);
    
    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async addSubStep(id: string, stepIndex: number, dto: AddSubStepDto, userId: string): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) throw new NotFoundException('Step not found');

    roadmap.steps[stepIndex].subSteps = roadmap.steps[stepIndex].subSteps || [];
    roadmap.steps[stepIndex].subSteps.push({
      title: dto.title,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      vocabularies: dto.vocabularies || [],
      completed: false
    } as any);

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateSubStep(
    id: string,
    stepIndex: number,
    subStepIndex: number,
    userId: string,
    updateDto: UpdateSubStepDto
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) throw new NotFoundException('Step not found');

    const step = roadmap.steps[stepIndex];
    if (!step.subSteps || subStepIndex < 0 || subStepIndex >= step.subSteps.length) {
      throw new NotFoundException('SubStep not found');
    }

    const subStep = step.subSteps[subStepIndex];
    if (updateDto.title !== undefined) subStep.title = updateDto.title;
    if (updateDto.description !== undefined) subStep.description = updateDto.description;

    if (updateDto.deadline !== undefined) {
      subStep.deadline = updateDto.deadline ? new Date(updateDto.deadline) : undefined;
    }

    if (updateDto.completed !== undefined) {
      subStep.completed = updateDto.completed;
      subStep.completedAt = subStep.completed ? new Date() : undefined;
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async removeSubStep(
    id: string,
    stepIndex: number,
    subStepIndex: number,
    userId: string
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) throw new NotFoundException('Step not found');

    const step = roadmap.steps[stepIndex];
    if (!step.subSteps || subStepIndex < 0 || subStepIndex >= step.subSteps.length) {
      throw new NotFoundException('SubStep not found');
    }

    step.subSteps.splice(subStepIndex, 1);

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async toggleSubStep(id: string, stepIndex: number, subStepIndex: number, userId: string): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) throw new NotFoundException('Step not found');
    
    const step = roadmap.steps[stepIndex];
    if (!step.subSteps || subStepIndex < 0 || subStepIndex >= step.subSteps.length) {
      throw new NotFoundException('SubStep not found');
    }

    const subStep = step.subSteps[subStepIndex];
    subStep.completed = !subStep.completed;
    subStep.completedAt = subStep.completed ? new Date() : undefined;
    
    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateVocabularies(
    id: string, 
    userId: string, 
    dto: UpdateVocabularyDto,
    stepIndex: number, 
    subStepIndex?: number
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');
    if (stepIndex < 0 || stepIndex >= roadmap.steps.length) throw new NotFoundException('Step not found');

    if (subStepIndex !== undefined) {
      const step = roadmap.steps[stepIndex];
      if (!step.subSteps || subStepIndex < 0 || subStepIndex >= step.subSteps.length) {
        throw new NotFoundException('SubStep not found');
      }
      step.subSteps[subStepIndex].vocabularies = dto.vocabularies;
    } else {
      roadmap.steps[stepIndex].vocabularies = dto.vocabularies;
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }
    await roadmap.deleteOne();
    return { deleted: true };
  }

  async getUserStats(userId: string) {
    const roadmaps = await this.roadmapModel.find({ owner: userId }).exec();
    const totalRoadmaps = roadmaps.length;
    const totalSteps = roadmaps.reduce((sum, r) => sum + r.steps.length, 0);
    const completedSteps = roadmaps.reduce(
      (sum, r) => sum + r.steps.filter((s) => s.completed).length,
      0,
    );
    return { totalRoadmaps, totalSteps, completedSteps };
  }

  async exportToAnkiCsv(id: string, userId: string): Promise<string> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) throw new ForbiddenException('Not authorized');

    const allVocabs: { front: string; back: string }[] = [];

    for (const step of roadmap.steps) {
      if (step.vocabularies && step.vocabularies.length > 0) {
        allVocabs.push(...step.vocabularies);
      }
      if (step.subSteps) {
        for (const sub of step.subSteps) {
          if (sub.vocabularies && sub.vocabularies.length > 0) {
            allVocabs.push(...sub.vocabularies);
          }
        }
      }
    }

    return allVocabs
      .map((card) => {
        const escapeCsvString = (str: string) => `"${str.replace(/"/g, '""')}"`;
        return `${escapeCsvString(card.front)},${escapeCsvString(card.back)}`;
      })
      .join('\n');
  }
}

