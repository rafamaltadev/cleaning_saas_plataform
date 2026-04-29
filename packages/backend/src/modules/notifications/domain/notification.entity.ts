import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type NotificationType = 'email' | 'sms' | 'webhook';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  booking_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  quote_id: string | null;

  @Column({ type: 'varchar' })
  type: NotificationType;

  @Column({ type: 'varchar' })
  template: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: NotificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
