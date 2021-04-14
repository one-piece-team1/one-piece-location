import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, getRepository, Repository } from 'typeorm';
import { Turn } from './turn.entity';
import { SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import * as ETurn from './enums';
import * as ITurn from './interfaces';
import { config } from '../../config';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  // jest default NODE_ENV is test
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
  private readonly logger: Logger = new Logger('TurnRepository');

  /**
   * @description Get nearest linestring query func
   * @private
   * @param {string} locationName
   * @returns {string}
   */
  /* istanbul ignore next */
  private getNearestLineStringQuery(locationName: string): string {
    locationName = locationName.replace("'", "''");
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
              FROM
                location
              WHERE
                location."locationName" = '${locationName}'
            ),
            geometries,
            true
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
            FROM
              location
            WHERE
              location."locationName" = '${locationName}'
          ),
          geometries,
          true
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
  /* istanbul ignore next */
  private getRoutePlanAsTextQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
    return `
      WITH route_plan AS
      (
        SELECT
          *,
          ST_Length(turn.srid) AS route_legnth
        FROM 
          public.turn
        JOIN
        (
          SELECT
            *
          FROM
            pgr_dijkstra(
              'SELECT id, fromnode::int AS source, tonode::int AS target, length AS cost FROM public.turn',
              ${Number(searchRoutePlansDto.startNode)},
              ${Number(searchRoutePlansDto.endNode)}
            )
          ) AS route
          ON 
            turn.fromnode = route.node
            ORDER BY seq
        )

        SELECT 
          *,
          ST_AsText(route_plan.geom) AS l_str
        FROM route_plan
        WHERE route_legnth IN
        (
          SELECT 
            MIN(route_legnth)
          FROM route_plan
          GROUP BY fromnode
        )
    `;
  }

  /**
   * @description Get route plan with result using ST_MakeLine to retrun Spatial plain text to reduce bandwidth
   * @private
   * @param {SearchRoutePlansDto} searchRoutePlansDto
   * @returns {string}
   */
  /* istanbul ignore next */
  private getRoutePlanMakeLineQuery(searchRoutePlansDto: SearchRoutePlansDto): string {
    return `
      WITH route_plan AS
      (
        SELECT
          *,
          ST_Length(turn.srid, true) AS route_legnth
        FROM 
          public.turn
        JOIN
        (
          SELECT
            *
          FROM
            pgr_dijkstra(
              'SELECT id, fromnode::int AS source, tonode::int AS target, length AS cost FROM public.turn',
              ${Number(searchRoutePlansDto.startNode)},
              ${Number(searchRoutePlansDto.endNode)}
            )
          ) AS route
          ON 
            turn.fromnode = route.node
            ORDER BY seq
        )

        SELECT 
          ST_MakeLine(route_plan.srid) AS l_str
        FROM route_plan
        WHERE route_legnth IN
        (
          SELECT 
            MIN(route_legnth)
          FROM route_plan
          GROUP By fromnode
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
      const startNodes = await getRepository(Turn, this.connectionName).query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.startLocationName));
      const endNodes = await getRepository(Turn, this.connectionName).query(this.getNearestLineStringQuery(searchForPlanStartandEndPointDto.endLocationName));
      if (!(startNodes instanceof Array) || !(endNodes instanceof Array)) throw new NotFoundException('Target plan nodes not found');
      if (startNodes.length < 1 || endNodes.length < 1) throw new NotFoundException('Target plan nodes not found');
      nearestLineStringResult.startNode = startNodes[0];
      nearestLineStringResult.endNode = endNodes[0];
      if (!nearestLineStringResult.startNode.st_distance || !nearestLineStringResult.endNode.st_distance) throw new NotFoundException('Target plan nodes not found');
      return nearestLineStringResult;
    } catch (error) {
      this.logger.error(error.message, '', 'GetNearestPlanLineStringError');
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
  public async getRoutesPlanning(searchRoutePlansDto: SearchRoutePlansDto): Promise<ITurn.INetworkGeometryResponse[]> {
    try {
      if (searchRoutePlansDto.type === ETurn.EPlanType.TEXT) {
        return await getRepository(Turn, this.connectionName).query(this.getRoutePlanAsTextQuery(searchRoutePlansDto));
      }
      return await getRepository(Turn, this.connectionName).query(this.getRoutePlanMakeLineQuery(searchRoutePlansDto));
    } catch (error) {
      this.logger.error(error.message, '', 'GetRoutesPlanningError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Generate Route planning with binding nearest linestring searching and calc dijkstra
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<ITurn.INetworkGeometryResponse[]>}
   */
  public async generateRoutesPlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.INetworkGeometryResponse[]> {
    try {
      const nearestNodes = await this.getNearestPlanLineString(searchForPlanStartandEndPointDto);
      if (!nearestNodes.startNode || !nearestNodes.endNode) throw new NotFoundException('Unable to find to start point or end point');
      return await this.getRoutesPlanning({ startNode: nearestNodes.startNode.fromnode, endNode: nearestNodes.endNode.tonode, type: searchForPlanStartandEndPointDto.type });
    } catch (error) {
      this.logger.error(error.message, '', 'GenerateRoutesPlanningError');
      throw new InternalServerErrorException(error.message);
    }
  }
}
