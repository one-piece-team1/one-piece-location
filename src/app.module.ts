import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { TurnModule } from './turns/turn.module';
import { LocationModule } from './locations/location.module';
import { HealthController } from './healths/health.controller';
import { ormConfig } from './config/orm.config';

@Module({
  controllers: [HealthController],
  imports: [TypeOrmModule.forRoot(ormConfig), LocationModule, TurnModule, TerminusModule],
})
export class AppModule {}
