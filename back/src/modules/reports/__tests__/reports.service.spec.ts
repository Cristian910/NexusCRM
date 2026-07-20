import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DealStage } from '@prisma/client';
import { ReportSortField, SortOrder } from '../dto/report.dto';

const mockPrisma = {
  deal: { findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
  $transaction: jest.fn(),
};

const ORG = 'org-1';

const mockDeal = {
  id: 'deal-1',
  title: 'Big Sale',
  value: 5000,
  stage: DealStage.NEGOTIATION,
  expectedCloseDate: null,
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-10T00:00:00Z'),
  client: { id: 'c-1', name: 'Acme Corp', company: 'Acme' },
  assignedTo: { id: 'u-1', firstName: 'Alice', lastName: 'Smith' },
  stageHistory: [{ createdAt: new Date('2026-06-05T00:00:00Z') }],
};

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('getDealsReport', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockResolvedValue([
        [mockDeal],
        1,
        { _sum: { value: 5000 }, _avg: { value: 5000 } },
      ]);
    });

    it('should return a structured report with generatedAt and summary', async () => {
      const result = await service.getDealsReport(ORG, {});
      expect(result).toHaveProperty('generatedAt');
      expect(result.summary.totalRows).toBe(1);
      expect(result.summary.totalValue).toBe(5000);
    });

    it('should map deal rows to DealReportRow shape', async () => {
      const result = await service.getDealsReport(ORG, {});
      const row = result.data[0];
      expect(row.id).toBe('deal-1');
      expect(row.value).toBe(5000);
      expect(row.client.name).toBe('Acme Corp');
      expect(row.assignedTo?.name).toBe('Alice Smith');
    });

    it('should compute stageAge from last stageHistory entry', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-06-22T00:00:00Z'));
      mockPrisma.$transaction.mockResolvedValue([
        [mockDeal],
        1,
        { _sum: { value: 5000 }, _avg: { value: 5000 } },
      ]);
      const result = await service.getDealsReport(ORG, {});
      expect(result.data[0].stageAge).toBe(17);
      jest.useRealTimers();
    });

    it('should handle null assignedTo', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [{ ...mockDeal, assignedTo: null }],
        1,
        { _sum: { value: 5000 }, _avg: { value: 5000 } },
      ]);
      const result = await service.getDealsReport(ORG, {});
      expect(result.data[0].assignedTo).toBeNull();
    });

    it('should compute totalPages correctly', async () => {
      mockPrisma.$transaction.mockResolvedValue([
        [],
        105,
        { _sum: { value: 0 }, _avg: { value: 0 } },
      ]);
      const result = await service.getDealsReport(ORG, { limit: 50 });
      expect(result.summary.totalPages).toBe(3);
    });

    it('should include filters in response', async () => {
      const result = await service.getDealsReport(ORG, {
        stage: DealStage.NEGOTIATION,
        dateFrom: '2026-06-01',
      });
      expect(result.filters.stage).toBe(DealStage.NEGOTIATION);
      expect(result.filters.dateFrom).toBe('2026-06-01');
      expect(result.filters.sortBy).toBe(ReportSortField.CREATED_AT);
      expect(result.filters.sortOrder).toBe(SortOrder.DESC);
    });
  });
});
