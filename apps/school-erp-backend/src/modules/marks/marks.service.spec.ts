import { Test, TestingModule } from '@nestjs/testing';
import { MarksService } from './marks.service';
import { PrismaService } from '../../database/prisma.service';

describe('MarksService', () => {
  let service: MarksService;
  let prisma: PrismaService;

  const mockPrisma = {
    examTerm: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    student: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    mark: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MarksService>(MarksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateGrade', () => {
    it('should calculate correct letter grades', () => {
      expect((service as any).calculateGrade(95)).toBe('A+');
      expect((service as any).calculateGrade(85)).toBe('A');
      expect((service as any).calculateGrade(75)).toBe('B');
      expect((service as any).calculateGrade(65)).toBe('C');
      expect((service as any).calculateGrade(55)).toBe('D');
      expect((service as any).calculateGrade(40)).toBe('F');
    });
  });

  describe('listExamTerms', () => {
    it('should return all exam terms for the school', async () => {
      const mockTerms = [{ id: 'term_1', name: 'Midterm 2026', academicYear: '2026-2027' }];
      mockPrisma.examTerm.findMany.mockResolvedValue(mockTerms);

      const result = await service.listExamTerms('sch_1');
      expect(result).toEqual(mockTerms);
      expect(mockPrisma.examTerm.findMany).toHaveBeenCalledWith({
        where: { schoolId: 'sch_1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
