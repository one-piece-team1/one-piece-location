import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LocationModule } from './locations/location.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), LocationModule],
})
export class AppModule {}
