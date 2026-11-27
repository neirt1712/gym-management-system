import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { PageQueryDto } from '../../common/pagination.dto';
import {
  CreateTrainingNoteDto,
  CreateTrainingPlanDto,
  ListTrainingNotesQueryDto,
  UpdateTrainingPlanDto,
} from './dto/training.dto';
import { TrainingService } from './training.service';

/** Theo dõi tập: UC29 (ghi chú), UC30 (kế hoạch). Staff không dùng nhóm này; Admin chỉ xem (Q20h). */
@Controller()
export class TrainingController {
  constructor(private readonly training: TrainingService) {}

  @Roles('MEMBER', 'TRAINER', 'ADMIN')
  @Get('members/:id/training-notes')
  listNotes(
    @Param('id') id: string,
    @Query() query: ListTrainingNotesQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.training.listNotes(id, query, user);
  }

  @Roles('TRAINER')
  @Post('members/:id/training-notes')
  createNote(@Param('id') id: string, @Body() dto: CreateTrainingNoteDto, @CurrentUser() user: AuthUser) {
    return this.training.createNote(id, dto, user);
  }

  @Roles('MEMBER', 'TRAINER', 'ADMIN')
  @Get('members/:id/training-plans')
  listPlans(@Param('id') id: string, @Query() query: PageQueryDto, @CurrentUser() user: AuthUser) {
    return this.training.listPlans(id, query, user);
  }

  @Roles('TRAINER')
  @Post('members/:id/training-plans')
  createPlan(@Param('id') id: string, @Body() dto: CreateTrainingPlanDto, @CurrentUser() user: AuthUser) {
    return this.training.createPlan(id, dto, user);
  }

  @Roles('TRAINER')
  @Patch('training-plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateTrainingPlanDto, @CurrentUser() user: AuthUser) {
    return this.training.updatePlan(id, dto, user);
  }
}
