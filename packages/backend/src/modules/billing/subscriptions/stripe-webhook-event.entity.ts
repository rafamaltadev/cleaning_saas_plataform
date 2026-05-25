import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('stripe_webhook_events')
export class StripeWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  stripe_event_id: string;

  @Column({ type: 'varchar' })
  event_type: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  processed_at: Date;
}
