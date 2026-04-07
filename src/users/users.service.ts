import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
//import { InjectModel } from '@nestjs/sequelize';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  // constructor(
  //   @InjectModel(User)
  //   private userModel: typeof User,
  // ) {}
  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }
  // create(createUserDto: CreateUserDto) {
  //   return this.userModel.create(createUserDto as any);
  // }

  create(createUserDto: CreateUserDto) {
    const users = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(users);
  }

  // findAll(): Promise<User[]> {
  //   //return this.userRepository.findAll();
  //   //return `This action returns all users`;
  //   //return this.userModel.findAll();
  //   return this.usersRepository.find();
  // }

  // async findAll(): Promise<User[]> {
  //   return this.usersRepository.find();
  // }

  async findAll(): Promise<User[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const users = await this.usersRepository.query('SELECT * FROM users');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return users;
  }

  // findAll() {
  //   //return this.userRepository.findAll();
  //   return `This action returns all users`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} user`;
  // }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
    //return this.userModel.findByPk(id);
   // return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.usersRepository.findOneBy({ id });
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  // async remove(id: number): Promise<number> {
  //   const rowsDeleted = await this.userModel.destroy({ where: { id } });
  //   return rowsDeleted;
  // }
  async remove(id: number){
    await this.usersRepository.delete({ id });
    return { message: 'success deleted', status: 'success', id };
  }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
