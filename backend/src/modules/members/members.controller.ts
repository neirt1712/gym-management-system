import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

/** Hội viên: UC19, UC28 (tìm, xem), UC20 (thêm, sửa tại quầy). */
@Controller('members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

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
}
