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

  /**
   * @description Get nearest linestring query func
   * @private
   * @param {string} locationId
   * @returns {string}
   */
  private getNearestLineStringQuery(locationId: string): string {
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

  /**
   * @description Get route plan with result using ST_AsText to transform and return reversed Geomertry::Geomertry data
   * @private
   * @param {SearchRoutePlansDto} searchRoutePlansDto
   * @returns {string}
   */
  private getRoutePlanAsTextQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
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

  /**
   * @description Get route plan with result using ST_MakeLine to retrun Spatial plain text to reduce bandwidth
   * @private
   * @param {SearchRoutePlansDto} searchRoutePlansDto
   * @returns {string}
   */
  private getRoutePlanMakeLineQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
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

  /**
   * @description Get nearest linestring node for each start and end point from location to connected to linestring for dijkstra calcuation
   * @Admin
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<ITurn.INearestNodeQueryResponse>}
   */
  public async getNearestPlanLineString(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.INearestNodeQueryResponse> {
    try {
      const nearestLineStringResult: ITurn.INearestNodeQueryResponse = {};
      const startNodes = await this.repoManager.query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.startId));
      const endNodes = await this.repoManager.query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.endId));
      if (!(startNodes instanceof Array) || !(endNodes instanceof Array)) throw new NotFoundException('Target plan nodes not fond');
      if (startNodes.length < 1 || endNodes.length < 1) throw new NotFoundException('Target plan nodes not fond');
      nearestLineStringResult.startNode = startNodes[0];
      nearestLineStringResult.endNode = endNodes[0];
      return nearestLineStringResult;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Get short path routes plannnig using pg_routing build-in library
   * @Admin
   * @public
   * @param {SearchRoutePlansDto} searchRoutePlansDto
   * @returns {Promise<ITurn.INetworkGeometryResponse[]>}
   */
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

  /**
   * @description Generate Route planning with binding nearest linestring searching and calc dijkstra
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<ITurn.INetworkGeometryResponse[]>}
   */
  async generateRoutesPlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.INetworkGeometryResponse[]> {
    try {
      const nearestNodes = await this.getNearestPlanLineString(searchForPlanStartandEndPointDto);
      if (!nearestNodes.startNode || !nearestNodes.endNode) throw new NotFoundException('Unable to find to start point or end point');
      return await this.getRoutesPlanning({ startNode: nearestNodes.startNode.fromnode, endNode: nearestNodes.endNode.tonode, type: ETurn.EPlanType.LINE });
    } catch (error) {
      this.logger.log(error.message, 'GenerateRoutesPlanning');
      throw new InternalServerErrorException(error.message);
    }
  }
}
