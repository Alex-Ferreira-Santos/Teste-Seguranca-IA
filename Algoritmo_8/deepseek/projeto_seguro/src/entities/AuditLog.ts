import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'varchar', nullable: true })
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}