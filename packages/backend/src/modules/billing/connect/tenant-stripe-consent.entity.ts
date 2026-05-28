import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StripeTermsVersion } from './stripe-terms-version.entity';

@Entity('tenant_stripe_consents')
export class TenantStripeConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column()
  terms_version: string;

  @Column('timestamp')
  accepted_at: Date;

  @Column()
  accepted_ip: string;

  @Column()
  accepted_user_agent: string;

  @Column('uuid')
  accepted_by_user_id: string;

  @ManyToOne(() => StripeTermsVersion, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'terms_version', referencedColumnName: 'version' })
  terms: StripeTermsVersion;
}
