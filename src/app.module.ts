import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { TurnModule } from './turns/turn.module';
import { LocationModule } from './locations/location.module';
import { HealthController } from './healths/health.controller';
import { EventStoreDBProvider } from './domains/databases/event-store-db.provider';
import { UserRepository } from './users/user.repository';
import { UserEventStoreRepository } from './domains/stores/user-event.store';
import { UserEventStoreProvider } from './domains/providers/user-event.provider';
import { LocaleKakfaConsumerService } from './domains/kafka-consumers/locale.consumer';
import { ormConfig } from './config/orm.config';

@Module({
  controllers: [HealthController],
  imports: [TypeOrmModule.forRoot(ormConfig), LocationModule, TurnModule, TerminusModule],
  providers: [...EventStoreDBProvider, UserRepository, UserEventStoreRepository, ...UserEventStoreProvider, LocaleKakfaConsumerService],
  exports: [...EventStoreDBProvider],
})
export class AppModule {}
