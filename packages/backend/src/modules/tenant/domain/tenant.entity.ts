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
  email: string;

  @Column({ type: 'varchar' })
  subscription_plan: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  stripe_customer_id: string | null;

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

  @Column({ type: 'varchar', nullable: true, unique: true })
  stripe_connect_account_id: string | null;

  @Column({ type: 'varchar', nullable: true })
  stripe_connect_status: string | null;

  @Column({ type: 'boolean', default: false })
  stripe_connect_charges_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  stripe_connect_payouts_enabled: boolean;

  @Column({ type: 'jsonb', nullable: true })
  stripe_connect_requirements: object | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  stripe_connect_country: string | null;

  @Column({ type: 'varchar', default: 'manual' })
  payment_mode: string;

  @Column({ type: 'varchar', default: 'prepaid' })
  payment_timing: string;

  @Column({ type: 'varchar', nullable: true })
  stripe_terms_accepted_version: string | null;

  @Column({ type: 'timestamp', nullable: true })
  stripe_terms_accepted_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  stripe_terms_accepted_ip: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
