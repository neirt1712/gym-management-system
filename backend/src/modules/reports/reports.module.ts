import { Module } from '@nestjs/common';
import { ReportsExportService } from './reports-export.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * Báo cáo (4 endpoint): tổng quan, doanh thu, gói sắp hết hạn, xuất Excel.
 * UC: UC39–UC41 · Người làm: Triển. Chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsExportService],
})
export class ReportsModule {}
