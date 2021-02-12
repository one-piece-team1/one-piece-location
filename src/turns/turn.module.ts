import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnController } from './turn.controller';
import { TurnRepository } from './turn.repository';
import { TurnService } from './turn.service';
import { config } from '../../config';
import { JwtStrategy } from '../strategy';
import { UserRepository } from '../users/user.repository';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: true,
    }),
    JwtModule.register({
      secret: config.JWT.SECRET,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '7d',
        issuer: 'one-piece',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
    TypeOrmModule.forFeature([TurnRepository, UserRepository]),
  ],
  controllers: [TurnController],
  providers: [TurnService, JwtStrategy],
})
export class TurnModule {}
