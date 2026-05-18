import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  subscription_plan: string;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar' })
  timezone: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  tenant_slug: string;

  @Column({ type: 'varchar', nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  primary_color: string | null;

  @Column({ type: 'varchar', nullable: true })
  favicon_url: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  social_links: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    website?: string;
  } | null;

  @Column({ type: 'varchar', nullable: true })
  google_maps_embed_url: string | null;

  @Column({ type: 'varchar', nullable: true })
  public_address: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
