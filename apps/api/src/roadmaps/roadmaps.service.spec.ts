import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoadmapsService } from './roadmaps.service';
import { Roadmap } from '../schemas/roadmap.schema';

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let mockRoadmapModel: any;

  beforeEach(async () => {
    mockRoadmapModel = {
      find: jest.fn(),
      findById: jest.fn(),
      exec: jest.fn(),
      save: jest.fn(),
      deleteOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
        {
          provide: getModelToken(Roadmap.name),
          useValue: mockRoadmapModel,
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportToAnkiCsv', () => {
    const mockUserId = 'user123';

    beforeEach(() => {
      mockRoadmapModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: 'roadmap123',
          owner: { toString: () => mockUserId },
          steps: [
            {
              vocabularies: [
                { front: 'Hello', back: 'Bonjour' },
                { front: 'Apple', back: 'Pomme' },
                { front: 'Hello "John"', back: 'Bonjour "Jean"' },
                { front: 'Hello, World', back: 'Bonjour, le monde' },
              ],
              subSteps: [
                {
                  vocabularies: [{ front: 'SubHello', back: 'SubBonjour' }],
                },
              ],
            },
          ],
        }),
      });
    });

    it('should extract and format basic cards handling quotes and commas', async () => {
      const result = await service.exportToAnkiCsv('roadmap123', mockUserId);
      expect(result).toContain('"Hello","Bonjour"');
      expect(result).toContain('"Apple","Pomme"');
      expect(result).toContain('"Hello ""John""","Bonjour ""Jean"""');
      expect(result).toContain('"Hello, World","Bonjour, le monde"');
      expect(result).toContain('"SubHello","SubBonjour"');
    });
  });
});
