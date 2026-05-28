import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('stripe_terms_versions')
export class StripeTermsVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  version: string;

  @Column({ length: 2 })
  country: string;

  @Column({ length: 5 })
  language: string;

  @Column('text')
  content: string;

  @Column('numeric', { precision: 5, scale: 2 })
  platform_fee_percent: number;

  @Column('numeric', { precision: 5, scale: 2 })
  stripe_fee_card_percent: number;

  @Column('numeric', { precision: 5, scale: 2, nullable: true })
  stripe_fee_pix_percent: number | null;

  @Column('numeric', { precision: 5, scale: 2, nullable: true })
  stripe_fee_ach_percent: number | null;

  @Column('timestamp')
  effective_from: Date;

  @Column('timestamp', { nullable: true })
  effective_until: Date | null;

  @CreateDateColumn()
  created_at: Date;
}
