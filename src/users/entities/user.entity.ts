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

import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
}
