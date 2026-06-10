import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('collection_amounts')
export class CollectionAmount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  flatNo: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('date')
  date: Date;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column('text', { nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
