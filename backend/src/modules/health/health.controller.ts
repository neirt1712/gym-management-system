import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/decorators';

/** GET /api/v1/health: kiểm tra server còn chạy. Hồng Anh sẽ thêm kiểm tra kết nối DB khi có Prisma. */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
