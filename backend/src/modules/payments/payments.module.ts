import { Module } from '@nestjs/common';

/**
 * Thanh toán (5 endpoint): VNPay, tiền mặt, IPN.
 * UC: UC12–UC14 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 * Còn rỗng: thêm controller, service, dto/ khi làm endpoint (skill /be-endpoint).
 */
@Module({})
export class PaymentsModule {}
