import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BookingStatus =
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed'
  | 'pending_approval'
  | 'pending_payment';

export type BookingOrigin = 'internal' | 'public';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  quote_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'timestamp' })
  scheduled_start: Date;

  @Column({ type: 'timestamp' })
  scheduled_end: Date;

  @Column({ type: 'varchar', default: 'confirmed' })
  status: BookingStatus;

  @Column({ type: 'varchar', nullable: true })
  assigned_team: string | null;

  @Column({ type: 'varchar' })
  idempotency_key: string;

  @Column({ type: 'varchar', nullable: true })
  service_address: string | null;

  @Column({ type: 'boolean', default: true })
  use_client_address: boolean;

  @Column({ type: 'varchar', nullable: true })
  observations: string | null;

  @Column({ type: 'varchar', length: 20, default: 'internal' })
  origin: BookingOrigin;

  @Column({ type: 'boolean', default: false })
  approval_required: boolean;

  @Column({ type: 'uuid', nullable: true })
  payment_id: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
