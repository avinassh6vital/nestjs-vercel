import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Upload } from '../../upload/entities/upload.entity';

export enum ExpenseType {
  WATER = 'water',
  ELECTRICITY_MAINTENANCE = 'electricity maintenance',
  ELECTRICITY_BILL = 'electricity bill',
  WATCHMEN_SALARY = 'watchmen salary',
  LIFT_MAINTENANCE_AND_PARTS = 'lift maintenance and parts',
  MOTOR_MAINTENANCE = 'motor maintenance',
  OTHER = 'other',
}

export enum WaterSource {
  TANKER = 'tanker',
  MAIN_WATER = 'main water',
  BOREWELL = 'borewell',
}

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ExpenseType,
  })
  type: ExpenseType;

  @Column({
    type: 'enum',
    enum: WaterSource,
    nullable: true,
  })
  waterSource?: WaterSource;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amount: number;

  @Column({
    type: 'date',
  })
  date: Date;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: true,
  })
  category?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  comments?: string;

  @Column({
    nullable: true,
  })
  attachmentId?: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'attachmentId' })
  attachment?: Upload;

  @Column({
    nullable: true,
  })
  createdBy?: string;

  @Column({
    nullable: true,
  })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}