import { IsString, IsInt } from 'class-validator';

export class CreateUserDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString({ message: 'Name must be a string' }) // Optional
  name: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString({ message: 'Email must be a string' }) // Optional
  email: string;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsInt({ message: 'Age must be an integer' }) // Optional
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  age: number;
}
