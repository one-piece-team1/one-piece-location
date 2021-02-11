import { ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTurnDto } from './dto';
import { TurnRepository } from './turn.repository';
import * as utils from '../libs/utils';
import * as ITurn from './interfaces';

@Injectable()
export class TurnService {
  constructor(
    @InjectRepository(TurnRepository)
    private turnRepository: TurnRepository,
  ) {}

  public async getRoutesPlanning(): Promise<ITurn.INetworkGeometryResponse[]> {
    const turns: ITurn.INetworkGeometryResponse[] = await this.turnRepository.getRoutesPlanning();
    if (!(turns instanceof Array))
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: 'Planning not found',
        },
        HttpStatus.NOT_FOUND,
      );

    turns.forEach((turn: ITurn.INetworkGeometryResponse) => {
      turn.lineString = utils.convertGeoTextToLineString(turn.l_str);
    });
    return turns;
  }
}
