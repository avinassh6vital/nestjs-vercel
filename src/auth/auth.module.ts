import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MembersModule } from 'src/members/members.module';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../database/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [
    MembersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '6000s' },
    }),
  ],
})
export class AuthModule {}
