import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/decorators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * GET /api/v1/health: server còn chạy và kết nối được DB.
 * Đúng hợp đồng openapi (chỉ trả { status: 'ok' }). DB lỗi thì Prisma ném lỗi,
 * filter chung trả 500 INTERNAL_ERROR, nên staging, CI vẫn biết server không khỏe.
 * Muốn trả thêm trường `db` hoặc mã 503 thì phải nhờ Triển sửa openapi trước (CR).
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
