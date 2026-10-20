import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/** Nạp một lần trong AppModule; module nghiệp vụ inject AuditService trực tiếp. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
