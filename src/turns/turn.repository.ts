import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateTurnDto } from './dto';
import { Turn } from './turn.entity';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {}
