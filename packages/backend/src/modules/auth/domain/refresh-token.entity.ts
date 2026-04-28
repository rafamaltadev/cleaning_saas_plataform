import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar' })
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
