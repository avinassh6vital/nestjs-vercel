import { IsString, IsInt, Min } from 'class-validator';

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
  @Min(0, { message: 'Age must be a non-negative number' }) // Optional
  age: number;
}
