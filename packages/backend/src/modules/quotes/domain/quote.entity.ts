import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'rejected';
export type QuoteOrigin = 'internal' | 'public';

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'uuid', nullable: true })
  pricing_rule_id: string | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: QuoteStatus;

  @Column({ type: 'integer' })
  estimated_total_cents: number;

  @Column({ type: 'varchar' })
  currency: string;

  @Column({ type: 'timestamp' })
  valid_until: Date;

  @Column({ type: 'integer', default: 0 })
  manual_discount_percent: number;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'varchar', nullable: true })
  service_address: string | null;

  @Column({ type: 'boolean', default: true })
  use_client_address: boolean;

  @Column({ type: 'varchar', nullable: true })
  observations: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_sqm: number | null;

  @Column({ type: 'timestamp', nullable: true })
  service_date: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'internal' })
  origin: QuoteOrigin;

  @Column({ type: 'uuid', nullable: true })
  created_by_client_id: string | null;

  @Column({ type: 'boolean', default: false })
  approval_required: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
