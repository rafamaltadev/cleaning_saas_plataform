import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar' })
  tier: string;

  @Column({ type: 'varchar', unique: true })
  stripe_price_id: string;

  @Column({ type: 'varchar' })
  interval: 'month' | 'semiannual' | 'year';

  @Column({ type: 'integer' })
  interval_count: number;

  @Column({ type: 'integer' })
  amount_cents: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp' })
  valid_from: Date;

  @Column({ type: 'timestamp', nullable: true })
  valid_until: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
