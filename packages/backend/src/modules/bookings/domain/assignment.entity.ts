import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type AssignmentStatus = 'assigned' | 'accepted' | 'declined' | 'completed';

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  booking_id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @Column({ type: 'varchar', default: 'assigned' })
  status: AssignmentStatus;

  @CreateDateColumn({ type: 'timestamp' })
  assigned_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date | null;
}