import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('meterReadings')
export class MeterReading {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flatNo: number;

  @Column('decimal', { precision: 10, scale: 2 })
  currentReading: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  previousReading?: number;

  @Column()
  readingDate: string; // YYYY-MM-DD

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
