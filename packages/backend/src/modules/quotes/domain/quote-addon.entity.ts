import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('quote_addons')
export class QuoteAddon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  quote_id: string;

  @Column({ type: 'uuid' })
  addon_id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer' })
  price_cents: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
