import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './domain/client.entity';
import { Address } from './domain/address.entity';
import { ClientRepository } from './infrastructure/client.repository';
import { AddressRepository } from './infrastructure/address.repository';
import { ClientsService } from './application/clients.service';
import { AddressesService } from './application/addresses.service';
import { ClientsController } from './interfaces/clients.controller';
import { AddressesController } from './interfaces/addresses.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Address]),
    AuditLogModule,
    AuthModule,
  ],
  providers: [ClientRepository, AddressRepository, ClientsService, AddressesService],
  controllers: [ClientsController, AddressesController],
  exports: [ClientRepository, AddressRepository],
})
export class ClientsModule {}
