import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_price_history')
export class SubscriptionPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_subscription_id: string;

  @Column({ type: 'integer' })
  old_price_cents: number;

  @Column({ type: 'integer' })
  new_price_cents: number;

  @Column({ type: 'numeric', precision: 5, scale: 4, nullable: true })
  discount_ratio_preserved: number | null;

  @Column({ type: 'timestamp' })
  effective_date: Date;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'timestamp', nullable: true })
  notified_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
