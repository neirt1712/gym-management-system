import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

/**
 * Đơn hàng (5 endpoint): quote, tạo, xem, hủy.
 * UC: UC09, UC14 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
