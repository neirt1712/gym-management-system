import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../../common/auth/decorators';
import { DateRangeQueryDto, ExpiringQueryDto, ExportQueryDto, RevenueQueryDto } from './dto/report.dto';
import { ReportsExportService } from './reports-export.service';
import { ReportsService } from './reports.service';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Báo cáo: UC39 (doanh thu), UC40 (tổng quan, gói sắp hết hạn), UC41 (xuất Excel). Chỉ Admin (quyết định 19). */
@Controller('reports')
@Roles('ADMIN')
export class ReportsController {
  constructor(
    private readonly reports: ReportsService,
    private readonly exporter: ReportsExportService,
  ) {}

  @Get('overview')
  overview(@Query() query: DateRangeQueryDto) {
    return this.reports.overview(query);
  }

  @Get('revenue')
  revenue(@Query() query: RevenueQueryDto) {
    return this.reports.revenue(query);
  }

  @Get('expiring-subscriptions')
  expiring(@Query() query: ExpiringQueryDto) {
    return this.reports.expiring(query);
  }

  @Get('export')
  async export(@Query() query: ExportQueryDto, @Res() res: Response) {
    const { filename, buffer } = await this.exporter.export(query);
    res.setHeader('Content-Type', XLSX_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
