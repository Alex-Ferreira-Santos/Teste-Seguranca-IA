import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { AuditLog } from '../entities/AuditLog';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // IMPORTANTE: false em produção
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Role, AuditLog],
  migrations: ['src/migrations/*.ts'],
  ssl: process.env.NODE_ENV === 'production',
  extra: {
    max: 20, // Pool de conexões
    idleTimeoutMillis: 30000,
  },
});