import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { User } from '../../auth/domain/user.entity';
import { Client } from '../../clients/domain/client.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { Payment } from '../domain/payment.entity';
import { PaymentService } from './payment.service';

@Injectable()
export class PublicPaymentService {
  private readonly logger = new Logger(PublicPaymentService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly paymentService: PaymentService,
  ) {}

  async createPublicPaymentIntent(params: {
    tenantSlug: string;
    bookingId: string;
    userId: string;
  }): Promise<{ clientSecret: string; publishableKey: string; paymentMethods: string[] }> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: params.tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });

    if (tenant.payment_mode !== 'stripe') {
      throw new BadRequestException({
        code: 'MANUAL_PAYMENT_MODE',
        message: 'This tenant uses manual payment mode',
      });
    }

    const user = await this.userRepo.findOne({ where: { id: params.userId, deleted_at: IsNull() } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });

    if (!user.roles.includes('client')) {
      throw new ForbiddenException({ code: 'NOT_CLIENT', message: 'Only clients can initiate payment' });
    }

    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) throw new NotFoundException({ code: 'CLIENT_NOT_FOUND', message: 'Client profile not found' });

    const booking = await this.bookingRepo.findOne({
      where: { id: params.bookingId, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!booking) throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });

    // Tenant isolation + ownership check
    if (booking.client_id !== client.id) {
      throw new ForbiddenException({
        code: 'BOOKING_ACCESS_DENIED',
        message: 'This booking does not belong to the authenticated client',
      });
    }

    if (!['pending_approval', 'pending_payment'].includes(booking.status)) {
      throw new BadRequestException({
        code: 'INVALID_BOOKING_STATUS',
        message: `Cannot pay for booking with status '${booking.status}'`,
      });
    }

    return this.paymentService.createPaymentIntent({
      bookingId: params.bookingId,
      tenantId: tenant.id,
      clientId: client.id,
    });
  }

  async getMyPayments(tenantSlug: string, userId: string): Promise<Payment[]> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });

    const user = await this.userRepo.findOne({ where: { id: userId, deleted_at: IsNull() } });
    if (!user) return [];

    const client = await this.clientRepo.findOne({
      where: { email: user.email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (!client) return [];

    return this.paymentRepo.find({
      where: { tenant_id: tenant.id, client_id: client.id, deleted_at: IsNull() },
      order: { created_at: 'DESC' },
    });
  }
}
