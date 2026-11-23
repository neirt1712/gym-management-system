import { ForbiddenException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { AppError } from './app-error';
import { toErrorResponse } from './to-error-response';

describe('toErrorResponse', () => {
  it('AppError lấy status và câu mặc định tiếng Việt từ danh mục, giữ details', () => {
    const result = toErrorResponse(new AppError('PENDING_ORDER_EXISTS', { orderId: 'o-1' }));
    expect(result.status).toBe(409);
    expect(result.body).toEqual({
      code: 'PENDING_ORDER_EXISTS',
      message: 'Đã có đơn chờ thanh toán cho gói này',
      details: { orderId: 'o-1' },
    });
  });

  it('AppError có message riêng thì dùng message đó', () => {
    expect(toErrorResponse(new AppError('VALIDATION_ERROR', [], 'Gói đã ngừng bán')).body.message).toBe(
      'Gói đã ngừng bán',
    );
  });

  it('lỗi có sẵn của Nest đổi sang mã chung', () => {
    expect(toErrorResponse(new NotFoundException()).body.code).toBe('NOT_FOUND');
    expect(toErrorResponse(new ForbiddenException()).status).toBe(403);
  });

  it('lỗi 5xx và lỗi lạ không lộ chi tiết', () => {
    expect(toErrorResponse(new InternalServerErrorException('db password sai')).body.message).toBe(
      'Lỗi hệ thống',
    );
    expect(toErrorResponse(new Error('bất ngờ'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Lỗi hệ thống', details: null },
    });
  });

  it('JSON sai cú pháp là VALIDATION_ERROR', () => {
    const parseError = Object.assign(new SyntaxError('Unexpected token'), {
      type: 'entity.parse.failed',
      status: 400,
    });
    expect(toErrorResponse(parseError)).toMatchObject({ status: 400, body: { code: 'VALIDATION_ERROR' } });
  });
});
