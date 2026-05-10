import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  name: string;

  @Column({ type: 'text', array: true, default: {} })
  permissions: string[];

  @Column({ type: 'int', default: 0 })
  level: number; // Quanto maior, mais privilégios

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdBy: string;
}