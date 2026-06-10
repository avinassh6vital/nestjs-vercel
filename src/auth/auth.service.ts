import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersDataService } from 'src/users-data/users-data.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersDataService,
    private jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.usersService.findOne(username);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
    //const { password, ...result } = user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const payload = { sub: user.userId, username: user.username };
    // TODO: Generate a JWT and return it here
    // instead of the user object
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
