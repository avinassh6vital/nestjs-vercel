import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Member } from '../../members/entities/member.entity';

@Entity('meterReadings')
export class MeterReading {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flatNo: string;

  @Column('decimal', { precision: 10, scale: 2 })
  currentReading: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  previousReading: number;

  @Column()
  readingDate: string; // YYYY-MM-DD

  @Column('text', { nullable: true })
  notes?: string;

  @ManyToOne(() => Member, (member) => member.meterReadings, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @Column({ nullable: true })
  memberId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

