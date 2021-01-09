import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTurnDto } from './dto';
import { TurnRepository } from './turn.repository';
import * as ITurn from './interfaces';
import { Turn } from './turn.entity';
import { coordinatesStringToLineString } from '../libs/utils';
import { LineString } from 'geojson';

@Injectable()
export class TurnService {
  private readonly logger: Logger = new Logger('TurnService');

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

  public async getRoutePlanning(endNode: number): Promise<ITurn.ResponseBase> {
    try {
      const routes: Turn[] = await this.turnRepository.getRoutePlanning(endNode);
      if (!routes) throw new NotFoundException();
      for (const route of routes) {
        (route.coordinates as LineString) = coordinatesStringToLineString(route.coordinates as string);
      }
      return {
        statusCode: 200,
        status: 'success',
        message: {
          routes,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetRoutePlanning-Service-Err');
      throw new InternalServerErrorException();
    }
  }
}
