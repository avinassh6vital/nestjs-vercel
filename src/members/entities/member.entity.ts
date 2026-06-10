import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MeterReading } from '../../meter_reading/entities/meter_reading.entity';
import { CollectionAmount } from '../../collection-amount/entities/collection-amount.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phoneNumber: string;

  @Column()
  flatNo: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => MeterReading, (meterReading) => meterReading.member)
  meterReadings: MeterReading[];

  @OneToMany(() => CollectionAmount, (collectionAmount) => collectionAmount.member)
  collectionAmounts: CollectionAmount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


