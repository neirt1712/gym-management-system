import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import {
  AvailabilityQueryDto,
  ListTrainersQueryDto,
  ReplaceAvailabilityDto,
  TrainerMembersQueryDto,
  UpdateTrainerDto,
} from './dto/trainer.dto';
import { TrainersService } from './trainers.service';

/** PT: UC21 (xem), UC22 (khung giờ rảnh), UC28 (hội viên phụ trách), UC33 (Admin sửa hồ sơ). */
@Controller('trainers')
export class TrainersController {
  constructor(private readonly trainers: TrainersService) {}

  @Public()
  @Get()
  list(@Query() query: ListTrainersQueryDto, @CurrentUser() user?: AuthUser) {
    return this.trainers.list(query, user);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.trainers.get(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTrainerDto) {
    return this.trainers.update(id, dto);
  }

  @Public()
  @Get(':id/availability')
  availability(@Param('id') id: string, @Query() query: AvailabilityQueryDto) {
    return this.trainers.availability(id, query);
  }

  @Roles('TRAINER', 'ADMIN')
  @Put(':id/availability')
  replaceAvailability(
    @Param('id') id: string,
    @Body() dto: ReplaceAvailabilityDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.trainers.replaceAvailability(id, dto, user);
  }

  @Roles('TRAINER', 'ADMIN')
  @Get(':id/members')
  members(@Param('id') id: string, @Query() query: TrainerMembersQueryDto, @CurrentUser() user: AuthUser) {
    return this.trainers.members(id, query, user);
  }
}
