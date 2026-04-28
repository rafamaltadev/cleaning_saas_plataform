import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'varchar' })
  resource_type: string;

  @Column({ type: 'uuid', nullable: true })
  resource_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  old_values: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  new_values: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
