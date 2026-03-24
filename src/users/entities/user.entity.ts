// import { Table, Column, Model, DataType } from 'sequelize-typescript';

// @Table({ tableName: 'users' })
// export class User extends Model<User> {

//  @Column({
//     type: DataType.STRING,
//     allowNull: false,
//   })
//   name: string;

//   @Column({
//     type: DataType.STRING,
//     allowNull: false,
//     unique: true,
//   })
//   email: string;

//   @Column({
//     type: DataType.INTEGER,
//     allowNull: true,
//   })
//   age: number;
// }

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  name: string;

  // This column will be automatically set on creation
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // This column will be automatically updated on each save
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
