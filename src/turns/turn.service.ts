import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TurnRepository } from './turn.repository';
import * as utils from '../libs/utils';
import HTTPResponse from '../libs/response';
import { SearchForPlanStartandEndPointDto, SearchRoutePlansDto } from './dto';
import * as IShare from '../interfaces';
import * as ITurn from './interfaces';

@Injectable()
export class TurnService {
  private readonly httPResponse: HTTPResponse = new HTTPResponse();
  private readonly logger: Logger = new Logger('TurnService');

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
   * @returns {Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[]> | HttpException>}
   */
  public async getRoutesPlanning(searchRoutePlansDto: SearchRoutePlansDto): Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[]> | HttpException> {
    try {
      const turns: ITurn.INetworkGeometryResponse[] = await this.turnRepository.getRoutesPlanning(searchRoutePlansDto);
      if (!(turns instanceof Array)) {
        this.logger.error('Planning not found', '', 'GetRoutesPlanningError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Planning not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      turns.forEach((turn: ITurn.INetworkGeometryResponse) => {
        turn.lineString = utils.convertGeoTextToLineString(turn.l_str);
      });
      return this.httPResponse.StatusOK<ITurn.INetworkGeometryResponse[]>(turns);
    } catch (error) {
      this.logger.error(error.message, '', 'GetRoutesPlanningError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Generate Route planning with binding nearest linestring searching and calc dijkstra
   * @public
   * @param {SearchForPlanStartandEndPointDto} searchForPlanStartandEndPointDto
   * @returns {Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[]> | HttpException>}
   */
  public async generateRoutesPlanning(searchForPlanStartandEndPointDto: SearchForPlanStartandEndPointDto): Promise<IShare.IResponseBase<ITurn.INetworkGeometryResponse[]> | HttpException> {
    try {
      const turns: ITurn.INetworkGeometryResponse[] = await this.turnRepository.generateRoutesPlanning(searchForPlanStartandEndPointDto);
      if (!(turns instanceof Array)) {
        this.logger.error('Planning not found', '', 'GetRoutesPlanningError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Planning not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      turns.forEach((turn: ITurn.INetworkGeometryResponse) => {
        turn.lineString = utils.convertGeoTextToLineString(turn.l_str);
      });
      return this.httPResponse.StatusOK<ITurn.INetworkGeometryResponse[]>(turns);
    } catch (error) {
      this.logger.error(error.message, '', 'GetRoutesPlanningError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
