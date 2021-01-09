import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ISearch } from '../interfaces';
import { JwtPayload } from 'strategy/interfaces';
import { CoordQueryDto, GetLocationById } from './dto';
import { ICoordQueryRange, ICoordQuerySpecifc, ResponseBase } from './interfaces';
import { ELicence } from './enums';
import { LocationRepository } from './location.repository';
import { Location } from './location.entity';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger('LocationService');

  constructor(@InjectRepository(LocationRepository) private locationRepository: LocationRepository) {}

  public getRequest(): string {
    return 'Hello World!';
  }

  /**
   * @description Get location by id
   * @public
   * @param {JwtPayload} user
   * @param {GetLocationById} getLocationById
   * @returns {Promise<ResponseBase>}
   */
  public async getLocationById(user: JwtPayload, getLocationById: GetLocationById): Promise<ResponseBase> {
    // if can not recognize user payload then throw unauthorized
    if (!user) throw new UnauthorizedException();
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) throw new NotAcceptableException();
    try {
      const location: Location = await this.locationRepository.getLocationById(getLocationById);

      if (!location)
        return {
          statusCode: 404,
          status: 'error',
          message: `Location ${getLocationById.id} not found`,
        };
      return {
        statusCode: 200,
        status: 'success',
        message: location,
      };
    } catch (error) {
      this.logger.log(error.message, 'GetLocationById');
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get location with name search and supporting pagination query
   * @public
   * @param {JwtPayload} user
   * @param {ISearch} searchReq
   * @returns {Promise<ResponseBase>}
   */
  public async getLocationsWithNameSearch(user: JwtPayload, searchReq: ISearch): Promise<ResponseBase> {
    // if can not recognize user payload then throw unauthorized
    if (!user) throw new UnauthorizedException();
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) throw new NotAcceptableException();
    // handling optional query params
    if (!searchReq.locationName) searchReq.locationName = '';
    if (!searchReq.countryCode) searchReq.countryCode = '';
    if (!searchReq.sort) searchReq.sort = 'DESC';
    try {
      const { locations, count, take, skip } = await this.locationRepository.getLocationsWithNameSearch(searchReq);
      return {
        statusCode: 200,
        status: 'success',
        message: {
          locations,
          take,
          skip,
          count,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetLocationsWithNameSearch');
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Search Location with geo data
   * @public
   * @param {JwtPayload} user
   * @param {CoordQueryDto} coordQueryDto
   * @returns {Promise<ResponseBase>}
   */
  public async getLocationByCoords(user: JwtPayload, coordQueryDto: CoordQueryDto): Promise<ResponseBase> {
    // if can not recognize user payload then throw unauthorized
    if (!user) throw new UnauthorizedException();
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) throw new NotAcceptableException();
    coordQueryDto.take = coordQueryDto.take ? Number(coordQueryDto.take) : 10;
    coordQueryDto.skip = coordQueryDto.skip ? Number(coordQueryDto.skip) : 0;
    try {
      const searchResult: ICoordQueryRange[] | ICoordQuerySpecifc[] = await this.locationRepository.getLocationByCoords(coordQueryDto);
      if (!searchResult) throw new NotFoundException();
      return {
        statusCode: 200,
        status: 'success',
        message: {
          searchResult,
          take: coordQueryDto.take,
          skip: coordQueryDto.skip,
          count: searchResult.length,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetLocationByCoords');
      throw new InternalServerErrorException(error.message);
    }
  }
}
