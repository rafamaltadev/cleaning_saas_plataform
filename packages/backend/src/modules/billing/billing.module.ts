import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './domain/invoice.entity';
import { Payment } from './domain/payment.entity';
import { InvoiceRepository } from './infrastructure/invoice.repository';
import { PaymentRepository } from './infrastructure/payment.repository';
import { InvoiceNumberService } from './application/invoice-number.service';
import { BillingService } from './application/billing.service';
import { InvoicesController } from './interfaces/invoices.controller';
import { PaymentsController } from './interfaces/payments.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment]), AuthModule],
  providers: [
    InvoiceRepository,
    PaymentRepository,
    InvoiceNumberService,
    BillingService,
  ],
  controllers: [InvoicesController, PaymentsController],
  exports: [BillingService],
})
export class BillingModule {}
