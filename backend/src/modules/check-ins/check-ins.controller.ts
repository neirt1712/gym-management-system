import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { CreateCheckInDto, ListCheckInsQueryDto } from './dto/check-in.dto';
import { CheckInsService } from './check-ins.service';

/** Check-in: UC16 (vào), UC17 (ra), UC18 (lịch sử, người đang trong phòng). */
@Controller('check-ins')
export class CheckInsController {
  constructor(private readonly checkIns: CheckInsService) {}

  @Roles('STAFF', 'ADMIN')
  @Post()
  create(@Body() dto: CreateCheckInDto, @CurrentUser() user: AuthUser) {
    return this.checkIns.create(dto, user);
  }

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Get()
  list(@Query() query: ListCheckInsQueryDto, @CurrentUser() user: AuthUser) {
    return this.checkIns.list(query, user);
  }

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Post(':id/checkout')
  @HttpCode(200)
  checkout(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.checkIns.checkout(id, user);
  }
}
