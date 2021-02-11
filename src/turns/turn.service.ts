import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTurnDto } from './dto';
import { TurnRepository } from './turn.repository';
import * as ITurn from './interfaces';

@Injectable()
export class TurnService {
  constructor(
    @InjectRepository(TurnRepository)
    private turnRepository: TurnRepository,
  ) {}
}
