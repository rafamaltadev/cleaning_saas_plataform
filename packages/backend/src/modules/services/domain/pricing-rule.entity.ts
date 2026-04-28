import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('pricing_rules')
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'integer', nullable: true })
  min_area: number | null;

  @Column({ type: 'integer', nullable: true })
  max_area: number | null;

  @Column({ type: 'varchar' })
  frequency: 'one_time' | 'weekly' | 'monthly';

  @Column({ type: 'integer' })
  discount_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  price_multiplier: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
