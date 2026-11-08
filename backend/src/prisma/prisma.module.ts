import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Nạp một lần trong AppModule; module khác inject PrismaService trực tiếp. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
