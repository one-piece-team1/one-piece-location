import { Module } from '@nestjs/common';
import { LocationModule } from './locations/location.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';
import { TurnModule } from './turns/turn.module';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), LocationModule, TurnModule],
})
export class AppModule {}
