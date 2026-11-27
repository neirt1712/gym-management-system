import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { CreateMemberDto } from './dto/create-member.dto';
import { DeskResetPasswordDto } from './dto/desk-reset-password.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberPasswordService } from './member-password.service';
import { MembersService } from './members.service';

/** Hội viên: UC19, UC28 (tìm, xem), UC20 (thêm, sửa tại quầy), UC04 (đặt lại mật khẩu tại quầy, Q15). */
@Controller('members')
export class MembersController {
  constructor(
    private readonly members: MembersService,
    private readonly passwords: MemberPasswordService,
  ) {}

  @Roles('STAFF', 'ADMIN', 'TRAINER')
  @Get()
  list(@Query() query: ListMembersQueryDto, @CurrentUser() user: AuthUser) {
    return this.members.list(query, user);
  }

  @Roles('STAFF', 'ADMIN')
  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.members.create(dto);
  }

  @Roles('STAFF', 'ADMIN', 'TRAINER')
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.members.get(id, user);
  }

  @Roles('STAFF', 'ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }

  @Roles('STAFF', 'ADMIN')
  @HttpCode(204)
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: DeskResetPasswordDto,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.passwords.resetAtDesk(id, dto, user);
  }
}
