import { ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { CreateTurnDto } from './dto';
import { Turn } from './turn.entity';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  async createTurn(createTurnDto: CreateTurnDto): Promise<Turn> {
    const { type, coordinates, fromNode, toNode } = createTurnDto;
    const turn = new Turn();
    turn.fromNode = fromNode;
    turn.toNode = toNode;
    turn.length = 0.0;
    turn.lineString = {
      type: 'LineString',
      coordinates,
    };
    turn.lineStringSrid = {
      type: 'LineString',
      coordinates,
    };
    try {
      await turn.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return turn;
  }
}
