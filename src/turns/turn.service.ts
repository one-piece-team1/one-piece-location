import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
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

  public async postTrun(createTurnDto: CreateTurnDto): Promise<ITurn.ResponseBase> {
    const turn = await this.turnRepository.createTurn(createTurnDto);
    if (!turn) throw new ConflictException();
    return {
      statusCode: 200,
      status: 'success',
      message: 'Turn Create Success',
    };
  }
}
