import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocationController } from './location.controller';
import { LocationRepository } from './location.repository';
import { LocationService } from './location.service';
import { config } from '../../config';
import { JwtStrategy } from 'strategy';
import { UserRepository } from '../users/user.repository';
import { LocationEventSubscribers } from '../subscribers/location.subscribe';

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
        expiresIn: '1h',
        issuer: 'one-piece',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
    TypeOrmModule.forFeature([LocationRepository, UserRepository]),
  ],
  controllers: [LocationController],
  providers: [LocationService, JwtStrategy, LocationEventSubscribers],
})
export class LocationModule {}
