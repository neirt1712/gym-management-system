import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';

/**
 * Gói tập (4 endpoint).
 * UC: UC07, UC08 · Người làm: Hồng Anh. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
