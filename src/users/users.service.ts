import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}
  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }
  create(createUserDto: CreateUserDto) {
    return this.userModel.create(createUserDto as any);
  }

  findAll(): Promise<User[]> {
    //return this.userRepository.findAll();
    //return `This action returns all users`;
    return this.userModel.findAll();
  }

  // findAll() {
  //   //return this.userRepository.findAll();
  //   return `This action returns all users`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} user`;
  // }

  findOne(id: number) {
    return this.userModel.findByPk(id);
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userModel.update(updateUserDto, { where: { id } });
    return `This action updates a #${id} user`;
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }

  async remove(id: number): Promise<number> {
    const rowsDeleted = await this.userModel.destroy({ where: { id } });
    return rowsDeleted;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
