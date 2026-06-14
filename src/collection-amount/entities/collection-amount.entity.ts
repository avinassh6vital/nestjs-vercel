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

@Entity('collection_amounts')
export class CollectionAmount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flatNo: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('date')
  date: Date;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToOne(() => Member, (member) => member.collectionAmounts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @Column({ nullable: true })
  memberId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

