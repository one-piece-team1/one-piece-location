import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { Turn } from './turn.entity';
import * as ITurn from './interfaces';
import { SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import * as ETurn from './enums';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  private readonly logger: Logger = new Logger('TurnRepository');
  private readonly repoManager: EntityManager = getManager();

  getNearestLineStringQuery(locationId: string): string {
    return `
      -- get turn result for each linestring
      WITH turn_result AS (
        SELECT
          id,
          turn.fromnode,
          turn.tonode,
          (ST_Dump(turn.geom)).geom AS geometries
        FROM
          turn
      )

      -- Removes duplicate rows from your result set
      SELECT
        (
          -- Calculate the distance between each linestring
          ST_Distance(
            (
              -- Get geometry point data from location
              SELECT
                point
              from
                location
              where
                id = '${locationId}'
            ),
            geometries
          )
        ),
        *
      FROM
        turn_result
      -- Only get the nearest point
      ORDER BY
        -- Get geometry point data from location
        ST_Distance(
          (
            SELECT
              point
            from
              location
            where
              id = '${locationId}'
          ),
          geometries
        )
      LIMIT
        1;
    `;
  }

  getRoutePlanAsTextQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
    return `
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
              ${Number(searchRoutePlansDto.startNode)},
              ${Number(searchRoutePlansDto.endNode)}
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
    `;
  }

  getRoutePlanMakeLineQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
    return `
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
              ${Number(searchRoutePlansDto.startNode)},
              ${Number(searchRoutePlansDto.endNode)}
            )
          ) AS route
          ON 
            turn.fromnode = route.node
            order by seq
        )

        SELECT 
          ST_MakeLine(route_plan.srid) as l_str
        FROM route_plan
        where route_legnth in
        (
          select 
            MIN(route_legnth)
          from route_plan
          group by fromnode
        )
    `;
  }

  async getNearestPlanLineString(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto) {
    try {
      const queries = [];
      queries.push(this.repoManager.query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.startId)));
      queries.push(this.repoManager.query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.endId)));
      const nodes: ITurn.INodeGeometryResponse[] = await Promise.all<ITurn.INodeGeometryResponse>(queries);
      if (!(nodes instanceof Array)) throw new NotFoundException('Target plan nodes not fond');
      if (!nodes[0][0] || !nodes[1][0]) throw new NotFoundException('Target plan nodes not fond');
      return {
        startNode: nodes[0][0],
        endNode: nodes[1][0],
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async getRoutesPlanning(searchRoutePlansDto: SearchRoutePlansDto): Promise<ITurn.INetworkGeometryResponse[]> {
    try {
      if (searchRoutePlansDto.type === ETurn.EPlanType.TEXT) {
        return await this.repoManager.query(this.getRoutePlanAsTextQuery(searchRoutePlansDto));
      }
      return await this.repoManager.query(this.getRoutePlanMakeLineQuery(searchRoutePlansDto));
    } catch (error) {
      this.logger.log(error.message, 'GetRoutesPlanning');
      throw new InternalServerErrorException(error.message);
    }
  }
}
