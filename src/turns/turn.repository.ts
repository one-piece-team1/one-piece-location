import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateTurnDto } from './dto';
import { Turn } from './turn.entity';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  async createTurn(createTurnDto: CreateTurnDto): Promise<Turn> {
    const { coordinates } = createTurnDto;
    const lat: number = coordinates[1];
    const lon: number = coordinates[0];
    const turn = new Turn();
    turn.point = {
      type: 'Point',
      coordinates: [lon, lat],
    };
    turn.srid = {
      type: 'Point',
      coordinates: [lon, lat],
    };
    turn.lat = lat;
    turn.lon = lon;
    try {
      await turn.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return turn;
  }
}
