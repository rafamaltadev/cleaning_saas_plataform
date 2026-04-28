import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';

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

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}