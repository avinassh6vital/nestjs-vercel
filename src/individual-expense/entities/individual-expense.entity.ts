import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Member } from '../../members/entities/member.entity';
import { MeterReading } from '../../meter_reading/entities/meter_reading.entity';

@Entity('individual_expenses')
export class IndividualExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flatNo: string;

  @Column({ nullable: true })
  memberId?: string;

  @ManyToOne(() => Member, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @Column({ nullable: true })
  meterReadingId?: string;

  @ManyToOne(() => MeterReading, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'meterReadingId' })
  meterReading?: MeterReading;

  @Column('decimal', { precision: 10, scale: 2 })
  meterReadingTotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  ratePerUnit: number;

  @Column('decimal', { precision: 12, scale: 2 })
  totalExpense: number;

  @Column('date')
  date: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
