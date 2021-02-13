import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import { TurnRepository } from './turn.repository';
import * as utils from '../libs/utils';
import * as ITurn from './interfaces';

@Injectable()
export class TurnService {
  constructor(
    @InjectRepository(TurnRepository)
    private turnRepository: TurnRepository,
  ) {}

  /**
   * @description Get nearest linestring node for each start and end point from location to connected to linestring for dijkstra calcuation
   * @Admin
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<ITurn.INearestNodeQueryResponse>}
   */
  public async getRouteStartandEndNodes(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.INearestNodeQueryResponse> {
    return await this.turnRepository.getNearestPlanLineString(searchForPlanStartandEndPointDto);
  }

  /**
   * @description Get short path routes plannnig using pg_routing build-in library
   * @Admin
   * @public
   * @param {SearchRoutePlansDto} searchRoutePlansDto
   * @returns {Promise<ITurn.INetworkGeometryResponse[]>}
   */
  public async getRoutesPlanning(searchRoutePlansDto: SearchRoutePlansDto): Promise<ITurn.INetworkGeometryResponse[]> {
    const turns: ITurn.INetworkGeometryResponse[] = await this.turnRepository.getRoutesPlanning(searchRoutePlansDto);
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

  /**
   * @description Generate Route planning with binding nearest linestring searching and calc dijkstra
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<ITurn.INetworkGeometryResponse[]>}
   */
  public async generateRoutesPlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<ITurn.ResponseBase> {
    const turns: ITurn.INetworkGeometryResponse[] = await this.turnRepository.generateRoutesPlanning(searchForPlanStartandEndPointDto);
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

    return {
      statusCode: HttpStatus.OK,
      status: 'success',
      message: turns,
    };
  }
}
