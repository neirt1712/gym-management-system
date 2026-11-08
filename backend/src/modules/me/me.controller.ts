import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { UpdateMeDto } from './dto/update-me.dto';
import { MeService } from './me.service';

/** Hồ sơ của tôi: UC05 (xem, sửa), UC15 (mã QR). */
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.me.get(user);
  }

  @Patch()
  update(@Body() dto: UpdateMeDto, @CurrentUser() user: AuthUser) {
    return this.me.update(dto, user);
  }

  @Roles('MEMBER')
  @HttpCode(200)
  @Post('qr-token/regenerate')
  regenerateQrToken(@CurrentUser() user: AuthUser) {
    return this.me.regenerateQrToken(user);
  }
}
