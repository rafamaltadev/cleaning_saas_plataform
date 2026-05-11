import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'integer' })
  base_rate_cents: number;

  @Column({ type: 'varchar' })
  unit: 'sqm' | 'hour' | 'flat';

  @Column({ type: 'uuid', nullable: true })
  category_id: string | null;

  @Column({ type: 'integer', nullable: true })
  estimated_duration_minutes: number | null;

  @Column({ type: 'varchar', default: 'fixed' })
  billing_type: 'fixed' | 'hourly';

  @Column({ type: 'jsonb', nullable: true })
  availability: object | null;

  @Column({ type: 'boolean', default: false })
  materials_included: boolean;

  @Column({ type: 'integer', nullable: true })
  materials_cost_cents: number | null;

  @Column({ type: 'varchar', nullable: true })
  observations: string | null;

  @Column({ type: 'boolean', default: false })
  has_addons: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
