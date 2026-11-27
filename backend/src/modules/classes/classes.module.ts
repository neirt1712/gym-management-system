import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

/**
 * Lớp học (7 endpoint).
 * UC: UC36–UC38 · Người làm: Triển. Danh sách endpoint: docs/spec/api-v3.md, chi tiết: docs/api/openapi.yaml.
 */
@Module({
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
