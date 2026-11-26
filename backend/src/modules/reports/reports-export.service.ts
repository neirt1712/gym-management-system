import { Injectable } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';
import { todayVn } from '../../common/time/vn-date';
import type { ExportQueryDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

const PACKAGE_TYPE: Record<string, string> = { GYM: 'Gói tập', PT: 'Gói PT' };
const GROUP_LABEL = { DAY: 'Ngày', MONTH: 'Tháng', YEAR: 'Năm' } as const;
const MONEY_FORMAT = '#,##0 "₫"';

/** Ghi tiêu đề cột (in đậm) và độ rộng cột cho một trang tính. */
const header = (ws: Worksheet, columns: { header: string; key: string; width: number }[]) => {
  ws.columns = columns;
  ws.getRow(1).font = { bold: true };
};

export type ExportFile = { filename: string; buffer: Buffer };

/** UC41 xuất báo cáo Excel; tên cột tiếng Việt (quyết định 18). Số liệu lấy từ đúng các hàm báo cáo JSON. */
@Injectable()
export class ReportsExportService {
  constructor(private readonly reports: ReportsService) {}

  async export(query: ExportQueryDto): Promise<ExportFile> {
    const wb = new Workbook();
    wb.creator = 'Gym Management';
    let filename: string;

    if (query.report === 'overview') {
      const r = await this.reports.overview(query);
      const ws = wb.addWorksheet('Tổng quan');
      header(ws, [
        { header: 'Chỉ số', key: 'label', width: 34 },
        { header: 'Giá trị', key: 'value', width: 18 },
      ]);
      ws.addRows([
        { label: 'Từ ngày', value: r.from },
        { label: 'Đến ngày', value: r.to },
        { label: 'Hội viên có gói còn hiệu lực hôm nay', value: r.totalMembers },
        { label: 'Hội viên mới trong kỳ', value: r.newMembers },
        { label: 'Gói hết hạn trong 7 ngày tới', value: r.expiringSoon },
        { label: 'Lượt check-in trong kỳ', value: r.checkIns },
      ]);
      const top = wb.addWorksheet('Gói bán chạy');
      header(top, [
        { header: 'Gói', key: 'name', width: 30 },
        { header: 'Loại', key: 'type', width: 12 },
        { header: 'Số đơn đã thanh toán', key: 'paidOrders', width: 22 },
        { header: 'Doanh thu', key: 'revenue', width: 18 },
      ]);
      for (const p of r.popularPackages) {
        top.addRow({
          name: p.package.name,
          type: PACKAGE_TYPE[p.package.type] ?? p.package.type,
          paidOrders: p.paidOrders,
          revenue: p.revenue,
        });
      }
      top.getColumn('revenue').numFmt = MONEY_FORMAT;
      filename = `tong-quan_${r.from}_${r.to}.xlsx`;
    } else if (query.report === 'revenue') {
      const r = await this.reports.revenue(query);
      const ws = wb.addWorksheet('Doanh thu');
      header(ws, [
        { header: GROUP_LABEL[r.groupBy], key: 'period', width: 14 },
        { header: 'Doanh thu', key: 'amount', width: 18 },
        { header: 'Số giao dịch', key: 'paymentCount', width: 14 },
      ]);
      ws.addRows(r.series);
      ws.addRow({ period: 'Tổng', amount: r.totalAmount, paymentCount: r.paymentCount }).font = {
        bold: true,
      };
      ws.getColumn('amount').numFmt = MONEY_FORMAT;
      const byPkg = wb.addWorksheet('Theo gói');
      header(byPkg, [
        { header: 'Gói', key: 'name', width: 30 },
        { header: 'Loại', key: 'type', width: 12 },
        { header: 'Doanh thu', key: 'amount', width: 18 },
        { header: 'Số giao dịch', key: 'paymentCount', width: 14 },
      ]);
      for (const p of r.byPackage) {
        byPkg.addRow({
          name: p.package.name,
          type: PACKAGE_TYPE[p.package.type] ?? p.package.type,
          amount: p.amount,
          paymentCount: p.paymentCount,
        });
      }
      byPkg.getColumn('amount').numFmt = MONEY_FORMAT;
      filename = `doanh-thu_${r.from}_${r.to}.xlsx`;
    } else {
      // Xuất đủ danh sách, không phân trang
      const r = await this.reports.expiring({ page: 1, pageSize: 10_000, days: query.days });
      const ws = wb.addWorksheet('Gói sắp hết hạn');
      header(ws, [
        { header: 'Mã hội viên', key: 'memberCode', width: 14 },
        { header: 'Họ tên', key: 'fullName', width: 26 },
        { header: 'Số điện thoại', key: 'phone', width: 14 },
        { header: 'Gói', key: 'packageName', width: 28 },
        { header: 'Ngày bắt đầu', key: 'startsOn', width: 14 },
        { header: 'Ngày hết hạn', key: 'endsOn', width: 14 },
        { header: 'Số ngày còn lại', key: 'daysLeft', width: 16 },
      ]);
      for (const s of r.data) {
        ws.addRow({
          memberCode: s.member.memberCode,
          fullName: s.member.fullName,
          phone: s.member.phone,
          packageName: s.packageName,
          startsOn: s.startsOn,
          endsOn: s.endsOn,
          daysLeft: s.daysLeft,
        });
      }
      filename = `goi-sap-het-han_${todayVn()}_${query.days}-ngay.xlsx`;
    }

    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    return { filename, buffer };
  }
}
