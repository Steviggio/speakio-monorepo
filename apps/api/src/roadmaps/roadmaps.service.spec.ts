import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RoadmapsService } from './roadmaps.service';
import { Roadmap } from '../schemas/roadmap.schema';
import { AnkiCsvExportAdapter } from './adapters/anki-csv-export.adapter';

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let mockRoadmapModel: any;
  let mockAnkiExportAdapter: jest.Mocked<AnkiCsvExportAdapter>;

  beforeEach(async () => {
    mockRoadmapModel = {
      find: jest.fn(),
      findById: jest.fn(),
      exec: jest.fn(),
      save: jest.fn(),
      deleteOne: jest.fn(),
    };

    mockAnkiExportAdapter = {
      export: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
        {
          provide: getModelToken(Roadmap.name),
          useValue: mockRoadmapModel,
        },
        {
          provide: AnkiCsvExportAdapter,
          useValue: mockAnkiExportAdapter,
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findStep and findSubStep', () => {
    const fakeRoadmap = {
      _id: 'roadmap1',
      steps: [
        {
          id: 'step-uuid-1',
          title: 'Step 1',
          completed: false,
          subSteps: [
            { id: 'sub-uuid-1', title: 'SubStep 1', completed: false },
            { id: 'sub-uuid-2', title: 'SubStep 2', completed: false },
          ],
        },
        {
          id: 'step-uuid-2',
          title: 'Step 2',
          completed: false,
          subSteps: [],
        },
      ],
    } as any;

    it('should find step by numeric index', () => {
      const result = service.findStep(fakeRoadmap, 0);
      expect(result.step.title).toBe('Step 1');
      expect(result.index).toBe(0);
    });

    it('should find step by numeric string index', () => {
      const result = service.findStep(fakeRoadmap, '1');
      expect(result.step.title).toBe('Step 2');
      expect(result.index).toBe(1);
    });

    it('should find step by UUID id', () => {
      const result = service.findStep(fakeRoadmap, 'step-uuid-2');
      expect(result.step.title).toBe('Step 2');
      expect(result.index).toBe(1);
    });

    it('should throw NotFoundException if step not found', () => {
      expect(() => service.findStep(fakeRoadmap, 99)).toThrow(
        NotFoundException,
      );
      expect(() => service.findStep(fakeRoadmap, 'non-existent-uuid')).toThrow(
        NotFoundException,
      );
    });

    it('should find substep by numeric index and UUID id', () => {
      const step = fakeRoadmap.steps[0];
      const byIndex = service.findSubStep(step, 1);
      expect(byIndex.subStep.title).toBe('SubStep 2');
      expect(byIndex.index).toBe(1);

      const byId = service.findSubStep(step, 'sub-uuid-1');
      expect(byId.subStep.title).toBe('SubStep 1');
      expect(byId.index).toBe(0);
    });

    it('should throw NotFoundException if substep not found', () => {
      const step = fakeRoadmap.steps[0];
      expect(() => service.findSubStep(step, 5)).toThrow(NotFoundException);
      expect(() => service.findSubStep(step, 'unknown-sub')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('Aggregate Invariants & Cascades', () => {
    const mockUserId = 'user123';
    let fakeDoc: any;

    beforeEach(() => {
      fakeDoc = {
        _id: 'roadmap1',
        owner: { toString: () => mockUserId },
        steps: [
          {
            id: 'step-uuid-1',
            title: 'Parent Step',
            completed: false,
            completedAt: undefined,
            subSteps: [
              {
                id: 'sub-1',
                title: 'Sub 1',
                completed: false,
                completedAt: undefined,
              },
              {
                id: 'sub-2',
                title: 'Sub 2',
                completed: false,
                completedAt: undefined,
              },
            ],
          },
        ],
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnValue(fakeDoc),
      };

      mockRoadmapModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeDoc),
      });
    });

    it('toggling/completing a parent step updates all child substeps to match', async () => {
      await service.toggleStep('roadmap1', 'step-uuid-1', mockUserId);

      const step = fakeDoc.steps[0];
      expect(step.completed).toBe(true);
      expect(step.completedAt).toBeInstanceOf(Date);
      expect(step.subSteps[0].completed).toBe(true);
      expect(step.subSteps[0].completedAt).toBeInstanceOf(Date);
      expect(step.subSteps[1].completed).toBe(true);
      expect(step.subSteps[1].completedAt).toBeInstanceOf(Date);

      // Toggle back to false
      await service.toggleStep('roadmap1', 0, mockUserId);
      expect(step.completed).toBe(false);
      expect(step.completedAt).toBeUndefined();
      expect(step.subSteps[0].completed).toBe(false);
      expect(step.subSteps[0].completedAt).toBeUndefined();
      expect(step.subSteps[1].completed).toBe(false);
      expect(step.subSteps[1].completedAt).toBeUndefined();
    });

    it('when all substeps of a step are completed, parent step is marked completed', async () => {
      // Toggle first substep
      await service.toggleSubStep(
        'roadmap1',
        'step-uuid-1',
        'sub-1',
        mockUserId,
      );
      expect(fakeDoc.steps[0].subSteps[0].completed).toBe(true);
      expect(fakeDoc.steps[0].completed).toBe(false);

      // Toggle second substep
      await service.toggleSubStep(
        'roadmap1',
        'step-uuid-1',
        'sub-2',
        mockUserId,
      );
      expect(fakeDoc.steps[0].subSteps[1].completed).toBe(true);
      // Now all substeps are true, parent step auto-completes
      expect(fakeDoc.steps[0].completed).toBe(true);
      expect(fakeDoc.steps[0].completedAt).toBeInstanceOf(Date);

      // Now un-toggle one substep -> parent step should become uncompleted
      await service.toggleSubStep(
        'roadmap1',
        'step-uuid-1',
        'sub-1',
        mockUserId,
      );
      expect(fakeDoc.steps[0].subSteps[0].completed).toBe(false);
      expect(fakeDoc.steps[0].completed).toBe(false);
      expect(fakeDoc.steps[0].completedAt).toBeUndefined();
    });

    it('updating substep completed state cascades correctly to parent step', async () => {
      await service.updateSubStep('roadmap1', 0, 0, mockUserId, {
        completed: true,
      });
      expect(fakeDoc.steps[0].completed).toBe(false);

      await service.updateSubStep('roadmap1', 0, 1, mockUserId, {
        completed: true,
      });
      expect(fakeDoc.steps[0].completed).toBe(true);
      expect(fakeDoc.steps[0].completedAt).toBeInstanceOf(Date);
    });

    it('updating parent step completed state cascades to all child substeps', async () => {
      await service.updateStep('roadmap1', 'step-uuid-1', mockUserId, {
        completed: true,
      });

      expect(fakeDoc.steps[0].completed).toBe(true);
      expect(fakeDoc.steps[0].completedAt).toBeInstanceOf(Date);
      expect(fakeDoc.steps[0].subSteps[0].completed).toBe(true);
      expect(fakeDoc.steps[0].subSteps[1].completed).toBe(true);
    });

    it('throws ForbiddenException if user does not own the roadmap', async () => {
      await expect(
        service.toggleStep('roadmap1', 0, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('exportToAnkiCsv delegation', () => {
    const mockUserId = 'user123';

    it('should delegate CSV generation to AnkiCsvExportAdapter', async () => {
      const fakeRoadmap = {
        _id: 'roadmap123',
        owner: { toString: () => mockUserId },
        steps: [],
      };
      mockRoadmapModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeRoadmap),
      });
      const exportSpy = jest
        .spyOn(mockAnkiExportAdapter, 'export')
        .mockReturnValue('"Front","Back"');

      const result = await service.exportToAnkiCsv('roadmap123', mockUserId);

      expect(exportSpy).toHaveBeenCalledWith(fakeRoadmap);
      expect(result).toBe('"Front","Back"');
    });
  });
});
