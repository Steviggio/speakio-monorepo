import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Roadmap,
  RoadmapDocument,
  RoadmapStep,
  RoadmapSubStep,
} from '../schemas/roadmap.schema';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import {
  AddStepDto,
  AddSubStepDto,
  UpdateVocabularyDto,
} from './dto/add-step.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { UpdateSubStepDto } from './dto/update-substep.dto';
import { AnkiCsvExportAdapter } from './adapters/anki-csv-export.adapter';

@Injectable()
export class RoadmapsService {
  constructor(
    @InjectModel(Roadmap.name) private roadmapModel: Model<RoadmapDocument>,
    private ankiExportAdapter: AnkiCsvExportAdapter,
  ) {}

  /**
   * Helper to find a step in a roadmap by UUID/string ID or numeric index.
   */
  findStep(
    roadmap: RoadmapDocument,
    stepIdOrIndex: string | number,
  ): { step: RoadmapStep; index: number } {
    if (roadmap.steps && roadmap.steps.length > 0) {
      if (
        typeof stepIdOrIndex === 'number' ||
        /^\d+$/.test(String(stepIdOrIndex))
      ) {
        const index =
          typeof stepIdOrIndex === 'number'
            ? stepIdOrIndex
            : parseInt(stepIdOrIndex, 10);
        if (index >= 0 && index < roadmap.steps.length) {
          return { step: roadmap.steps[index], index };
        }
      }

      const idStr = String(stepIdOrIndex);
      const index = roadmap.steps.findIndex(
        (s) => s.id === idStr || (s as any)._id?.toString() === idStr,
      );
      if (index !== -1) {
        return { step: roadmap.steps[index], index };
      }
    }
    throw new NotFoundException('Step not found');
  }

  /**
   * Helper to find a substep in a step by UUID/string ID or numeric index.
   */
  findSubStep(
    step: RoadmapStep,
    subStepIdOrIndex: string | number,
  ): { subStep: RoadmapSubStep; index: number } {
    if (step.subSteps && step.subSteps.length > 0) {
      if (
        typeof subStepIdOrIndex === 'number' ||
        /^\d+$/.test(String(subStepIdOrIndex))
      ) {
        const index =
          typeof subStepIdOrIndex === 'number'
            ? subStepIdOrIndex
            : parseInt(subStepIdOrIndex, 10);
        if (index >= 0 && index < step.subSteps.length) {
          return { subStep: step.subSteps[index], index };
        }
      }

      const idStr = String(subStepIdOrIndex);
      const index = step.subSteps.findIndex(
        (sub) => sub.id === idStr || (sub as any)._id?.toString() === idStr,
      );
      if (index !== -1) {
        return { subStep: step.subSteps[index], index };
      }
    }
    throw new NotFoundException('SubStep not found');
  }

  async create(
    createDto: CreateRoadmapDto,
    userId: string,
  ): Promise<RoadmapDocument> {
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

  async update(
    id: string,
    userId: string,
    updateDto: UpdateRoadmapDto,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel
      .findOneAndUpdate(
        { _id: id, owner: userId },
        { $set: updateDto },
        { new: true },
      )
      .exec();

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found or unauthorized');
    }

    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateStep(
    roadmapId: string,
    stepIdOrIndex: string | number,
    userId: string,
    updateDto: UpdateStepDto,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(roadmapId).exec();

    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);

    if (updateDto.title !== undefined) step.title = updateDto.title;
    if (updateDto.description !== undefined)
      step.description = updateDto.description;

    if (updateDto.deadline !== undefined) {
      step.deadline = updateDto.deadline
        ? new Date(updateDto.deadline)
        : undefined;
    }

    if (updateDto.completed !== undefined) {
      step.completed = updateDto.completed;
      step.completedAt = step.completed ? new Date() : undefined;
      // Cascade to substeps
      if (step.subSteps && step.subSteps.length > 0) {
        for (const sub of step.subSteps) {
          sub.completed = step.completed;
          sub.completedAt = step.completed ? new Date() : undefined;
        }
      }
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async toggleStep(
    id: string,
    stepIdOrIndex: string | number,
    userId: string,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId) {
      throw new ForbiddenException('Not authorized');
    }

    const { step } = this.findStep(roadmap, stepIdOrIndex);

    const nextCompleted = !step.completed;
    step.completed = nextCompleted;
    step.completedAt = nextCompleted ? new Date() : undefined;

    // Invariant Cascade: Toggling/completing a parent step updates all child substeps to match
    if (step.subSteps && step.subSteps.length > 0) {
      for (const sub of step.subSteps) {
        sub.completed = nextCompleted;
        sub.completedAt = nextCompleted ? new Date() : undefined;
      }
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async addStep(
    id: string,
    dto: AddStepDto,
    userId: string,
  ): Promise<RoadmapDocument> {
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
      completed: false,
    } as any);

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async addSubStep(
    id: string,
    stepIdOrIndex: string | number,
    dto: AddSubStepDto,
    userId: string,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);

    step.subSteps = step.subSteps || [];
    step.subSteps.push({
      title: dto.title,
      description: dto.description,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      vocabularies: dto.vocabularies || [],
      completed: false,
    } as any);

    // If step was completed and now has a non-completed substep, maintain invariant
    if (step.completed) {
      step.completed = false;
      step.completedAt = undefined;
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateSubStep(
    id: string,
    stepIdOrIndex: string | number,
    subStepIdOrIndex: string | number,
    userId: string,
    updateDto: UpdateSubStepDto,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);
    const { subStep } = this.findSubStep(step, subStepIdOrIndex);

    if (updateDto.title !== undefined) subStep.title = updateDto.title;
    if (updateDto.description !== undefined)
      subStep.description = updateDto.description;

    if (updateDto.deadline !== undefined) {
      subStep.deadline = updateDto.deadline
        ? new Date(updateDto.deadline)
        : undefined;
    }

    if (updateDto.completed !== undefined) {
      subStep.completed = updateDto.completed;
      subStep.completedAt = subStep.completed ? new Date() : undefined;

      // Invariant: When all substeps of a step are completed, parent step is marked completed
      if (step.subSteps && step.subSteps.length > 0) {
        const allCompleted = step.subSteps.every((s) => s.completed);
        if (allCompleted && !step.completed) {
          step.completed = true;
          step.completedAt = new Date();
        } else if (!allCompleted && step.completed) {
          step.completed = false;
          step.completedAt = undefined;
        }
      }
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async removeSubStep(
    id: string,
    stepIdOrIndex: string | number,
    subStepIdOrIndex: string | number,
    userId: string,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);
    const { index: subIndex } = this.findSubStep(step, subStepIdOrIndex);

    step.subSteps.splice(subIndex, 1);

    // Invariant check if remaining substeps are all completed
    if (step.subSteps.length > 0) {
      const allCompleted = step.subSteps.every((s) => s.completed);
      if (allCompleted && !step.completed) {
        step.completed = true;
        step.completedAt = new Date();
      }
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async toggleSubStep(
    id: string,
    stepIdOrIndex: string | number,
    subStepIdOrIndex: string | number,
    userId: string,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);
    const { subStep } = this.findSubStep(step, subStepIdOrIndex);

    const nextCompleted = !subStep.completed;
    subStep.completed = nextCompleted;
    subStep.completedAt = nextCompleted ? new Date() : undefined;

    // Invariant check:
    // When all substeps of a step are completed, parent step is marked completed.
    // If any substep is uncompleted, parent step should be uncompleted.
    if (step.subSteps && step.subSteps.length > 0) {
      const allCompleted = step.subSteps.every((s) => s.completed);
      if (allCompleted && !step.completed) {
        step.completed = true;
        step.completedAt = new Date();
      } else if (!allCompleted && step.completed) {
        step.completed = false;
        step.completedAt = undefined;
      }
    }

    roadmap.markModified('steps');
    await roadmap.save();
    return roadmap.populate('owner', 'username avatarUrl');
  }

  async updateVocabularies(
    id: string,
    userId: string,
    dto: UpdateVocabularyDto,
    stepIdOrIndex: string | number,
    subStepIdOrIndex?: string | number,
  ): Promise<RoadmapDocument> {
    const roadmap = await this.roadmapModel.findById(id).exec();
    if (!roadmap) throw new NotFoundException('Roadmap not found');
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    const { step } = this.findStep(roadmap, stepIdOrIndex);

    if (
      subStepIdOrIndex !== undefined &&
      subStepIdOrIndex !== null &&
      subStepIdOrIndex !== ''
    ) {
      const { subStep } = this.findSubStep(step, subStepIdOrIndex);
      subStep.vocabularies = dto.vocabularies;
    } else {
      step.vocabularies = dto.vocabularies;
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
    if (roadmap.owner.toString() !== userId)
      throw new ForbiddenException('Not authorized');

    return this.ankiExportAdapter.export(roadmap);
  }
}
