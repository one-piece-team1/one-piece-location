import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Turn } from './turn.entity';
import * as ITurn from './interfaces';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  private readonly logger: Logger = new Logger('TurnRepository');
  private readonly repoManager: EntityManager = getManager();

  async getRoutesPlanning(): Promise<ITurn.INetworkGeometryResponse[]> {
    try {
      // maybe maybe will change to use ST_MakeLine with string return
      return await this.repoManager.query(
        `
          WITH route_plan AS
          (
            SELECT
              *,
              ST_Length(turn.srid) as route_legnth
            FROM 
              public.turn
            JOIN
            (
              SELECT
                *
              FROM
                pgr_dijkstra(
                  'select id, fromnode::int as source, tonode::int as target, length as cost from public.turn',
                  2945,
                  26349
                )
            ) AS route
            ON 
              turn.fromnode = route.node
              order by seq
          )

          SELECT 
            *,
            ST_AsText(route_plan.geom) as l_str
          FROM route_plan
          where route_legnth in
          (
            select 
              MIN(route_legnth)
            from route_plan
            group by fromnode
          )
        `,
      );
    } catch (error) {
      this.logger.log(error.message, 'GetRoutesPlanning');
      throw new InternalServerErrorException(error.message);
    }
  }
}
