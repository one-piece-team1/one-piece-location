import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnController } from './turn.controller';
import { TurnRepository } from './turn.repository';
import { TurnService } from './turn.service';

@Module({
  imports: [TypeOrmModule.forFeature([TurnRepository])],
  controllers: [TurnController],
  providers: [TurnService],
})
export class TurnModule {}
