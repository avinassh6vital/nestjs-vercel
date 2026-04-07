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

  @Column({ nullable: true, type: 'varchar' })
  email: string;

  @Column({ nullable: true, type: 'int' })
  age: number;

  @Column({ nullable: true, type: 'varchar' })
  name: string;

  // This column will be automatically set on creation
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // This column will be automatically updated on each save
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}



//reading purpose

//     @PrimaryGeneratedColumn()
//     id: number

//     @Column()
//     firstName: string

//     @Column()
//     lastName: string

//     @Column()
//     isActive: boolean

//      @PrimaryColumn()
//     id: number

//     @PrimaryGeneratedColumn("uuid")
//     id: string

//     @Column("int")

//     @Column("varchar", { length: 100 })

//     @Column({ type: "int" })

//     @Column({ type: "boolean" })
    
// export enum UserRole {
//     ADMIN = "admin",
//     EDITOR = "editor",
//     GHOST = "ghost",
// }


// @Column({
//         type: "enum",
//         enum: UserRole,
//         default: UserRole.GHOST,
//     })
//     role: UserRole


//     @Column({
//         type: "enum",
//         enum: ["admin", "editor", "ghost"],
//         default: "ghost"
//     })
//     role: UserRoleType

//     @Column("simple-array")
//     names: string[]

//     const user = new User()
// user.names = ["Alexander", "Alex", "Sasha", "Shurik"]
    //reading purpose

    //reading purpose