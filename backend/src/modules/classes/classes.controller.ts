import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, Public, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { ClassesService } from './classes.service';
import {
  CreateClassDto,
  ListClassesQueryDto,
  ListEnrollmentsQueryDto,
  UpdateClassDto,
} from './dto/class.dto';

/** Lớp học: UC36 (Admin quản lý lớp), UC37 (hội viên xem, đăng ký, hủy), UC38 (danh sách đăng ký). */
@Controller('classes')
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  @Public()
  @Get()
  list(@Query() query: ListClassesQueryDto, @CurrentUser() user: AuthUser | undefined) {
    return this.classes.list(query, user);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classes.create(dto);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined) {
    return this.classes.get(id, user);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classes.update(id, dto);
  }

  /** 201 khi tạo mới, 200 khi đã đăng ký từ trước (gửi lặp). */
  @Roles('MEMBER')
  @Post(':id/enrollments')
  async enroll(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { created, enrollment } = await this.classes.enroll(id, user);
    res.status(created ? 201 : 200);
    return enrollment;
  }

  @Roles('ADMIN', 'STAFF', 'TRAINER')
  @Get(':id/enrollments')
  listEnrollments(
    @Param('id') id: string,
    @Query() query: ListEnrollmentsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.classes.listEnrollments(id, query, user);
  }

  @Roles('MEMBER')
  @HttpCode(204)
  @Delete(':id/enrollments/me')
  cancelMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.classes.cancelMine(id, user);
  }
}
