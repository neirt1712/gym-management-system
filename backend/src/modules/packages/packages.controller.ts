import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Public, Roles } from '../../common/auth/decorators';
import type { AuthUser } from '../../common/http/request-context';
import { CreatePackageDto } from './dto/create-package.dto';
import { ListPackagesQueryDto } from './dto/list-packages-query.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PackagesService } from './packages.service';

/** Gói tập: UC07 (xem, tìm, lọc), UC08 (Admin thêm, sửa, ngừng bán). */
@Controller('packages')
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Public()
  @Get()
  list(@Query() query: ListPackagesQueryDto, @CurrentUser() user?: AuthUser) {
    return this.packages.list(query, user);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.packages.get(id);
  }

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreatePackageDto, @CurrentUser() user: AuthUser) {
    return this.packages.create(dto, user);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto, @CurrentUser() user: AuthUser) {
    return this.packages.update(id, dto, user);
  }
}
