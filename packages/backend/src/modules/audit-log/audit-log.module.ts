import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './domain/audit-log.entity';
import { AuditLogService } from './application/audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
