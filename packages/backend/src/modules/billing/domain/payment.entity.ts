import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PaymentStatus = 'pending' | 'completed' | 'failed';

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

  @Column({ type: 'integer' })
  amount_cents: number;

  @Column({ type: 'varchar' })
  currency: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'varchar' })
  payment_method: string;

  @Column({ type: 'varchar', nullable: true })
  external_reference: string | null;

  @Column({ type: 'varchar' })
  idempotency_key: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
