import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InvoiceStatus = 'draft' | 'issued' | 'paid';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'integer' })
  total_cents: number;

  @Column({ type: 'varchar' })
  currency: string;

  @Column({ type: 'varchar' })
  invoice_number: string;

  @Column({ type: 'timestamp' })
  issued_at: Date;

  @Column({ type: 'timestamp' })
  due_date: Date;

  @Column({ type: 'varchar', default: 'draft' })
  status: InvoiceStatus;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}
