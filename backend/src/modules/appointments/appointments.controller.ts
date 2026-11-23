import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { AppointmentsService } from './appointments.service';
import {
  CompleteAppointmentDto,
  CreateAppointmentDto,
  CreateProposalDto,
  ListAppointmentsQueryDto,
  RejectProposalDto,
  VersionedActionDto,
} from './dto/appointment.dto';

/** Lịch PT: UC23 (đề xuất), UC24–UC25 (trả lời, đổi, hủy), UC26 (xem), UC27 (xác nhận buổi). */
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Roles('MEMBER', 'STAFF', 'ADMIN')
  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointments.create(dto, user);
  }

  @Get()
  list(@Query() query: ListAppointmentsQueryDto, @CurrentUser() user: AuthUser) {
    return this.appointments.list(query, user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.appointments.get(id, user);
  }

  @Roles('MEMBER', 'TRAINER')
  @Post(':id/proposals')
  propose(@Param('id') id: string, @Body() dto: CreateProposalDto, @CurrentUser() user: AuthUser) {
    return this.appointments.propose(id, dto, user);
  }

  @Roles('MEMBER', 'TRAINER')
  @HttpCode(200)
  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() dto: VersionedActionDto, @CurrentUser() user: AuthUser) {
    return this.appointments.accept(id, dto.expectedVersion, user);
  }

  @Roles('MEMBER', 'TRAINER')
  @HttpCode(200)
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectProposalDto, @CurrentUser() user: AuthUser) {
    return this.appointments.reject(id, dto, user);
  }

  @Roles('TRAINER', 'ADMIN')
  @HttpCode(200)
  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointments.complete(id, dto, user);
  }
}
