import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'manual_pending'
  | 'completed';

export type PaymentMethod = 'card' | 'pix' | 'ach' | 'apple_pay' | 'google_pay' | 'manual' | 'invoice';
export type PaymentMode = 'manual' | 'stripe';
export type PaymentTiming = 'prepaid' | 'postpaid';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  booking_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  quote_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  client_id: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  stripe_payment_intent_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripe_charge_id: string | null;

  @Column({ type: 'integer' })
  amount_cents: number;

  @Column({ type: 'integer', nullable: true, default: 0 })
  application_fee_cents: number;

  @Column({ type: 'integer', nullable: true })
  stripe_fee_cents: number | null;

  @Column({ type: 'integer', nullable: true })
  net_amount_cents: number | null;

  @Column({ type: 'varchar' })
  currency: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'varchar' })
  payment_method: string;

  @Column({ type: 'varchar', nullable: true, default: 'manual' })
  payment_mode: PaymentMode | null;

  @Column({ type: 'varchar', nullable: true, default: 'prepaid' })
  payment_timing: PaymentTiming | null;

  @Column({ type: 'varchar', nullable: true })
  external_reference: string | null;

  @Column({ type: 'varchar', nullable: true })
  idempotency_key: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  refunded_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  failure_reason: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeCurrency(): void {
    if (this.currency) {
      this.currency = this.currency.toUpperCase();
    }
  }
}
