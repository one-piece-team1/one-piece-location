import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from './relations';
import { LocationRepository } from './location.repository';
import { CoordQueryDto, GetLocationById } from './dto';
import HTTPResponse from '../libs/response';
import * as IShare from '../interfaces';
import { ICoordQueryRange, ICoordQuerySpecifc } from './interfaces';
import { ELicence } from './enums';

@Injectable()
export class LocationService {
  private readonly httPResponse: HTTPResponse = new HTTPResponse();
  private readonly logger: Logger = new Logger('LocationService');

  constructor(@InjectRepository(LocationRepository) private locationRepository: LocationRepository) {}

  /**
   * @description Get location by id
   * @public
   * @param {IShare.JwtPayload} user
   * @param {GetLocationById} getLocationById
   * @returns {Promise<IShare.IResponseBase<Location> | HttpException>}
   */
  public async getLocationById(user: IShare.JwtPayload, getLocationById: GetLocationById): Promise<IShare.IResponseBase<Location> | HttpException> {
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) {
      this.logger.error('Not acceptable licence', '', 'GetLocationByIdError');
      return new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: 'Not acceptable licence',
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    try {
      const location: Location = await this.locationRepository.getLocationById(getLocationById);
      if (!location) {
        this.logger.error(`Location ${getLocationById.id} not found`, '', 'GetLocationByIdError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Location ${getLocationById.id} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.httPResponse.StatusOK(location);
    } catch (error) {
      this.logger.error(error.message, '', 'GetLocationByIdError');
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
   * @description Get location with name search and supporting pagination query
   * @public
   * @param {IShare.JwtPayload} user
   * @param {IShare.ISearch} searchReq
   * @returns {Promise<IShare.IResponseBase<IShare.ILocationPagingResponseBase<Location[]>> | HttpException>}
   */
  public async getLocationsWithNameSearch(user: IShare.JwtPayload, searchReq: IShare.ISearch): Promise<IShare.IResponseBase<IShare.ILocationPagingResponseBase<Location[]>> | HttpException> {
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) {
      this.logger.error('Not acceptable licence', '', 'GetLocationsWithNameSearchError');
      return new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: 'Not acceptable licence',
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    // handling optional query params
    if (!searchReq.locationName) searchReq.locationName = '';
    if (!searchReq.countryName) searchReq.countryName = '';
    if (!searchReq.sort) searchReq.sort = 'DESC';
    try {
      const { locations, count, take, skip } = await this.locationRepository.getLocationsWithNameSearch(searchReq);
      return this.httPResponse.StatusOK({
        locations,
        take,
        skip,
        count,
      });
    } catch (error) {
      this.logger.error(error.message, '', 'GetLocationsWithNameSearchError');
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
   * @description Search Location with geo data
   * @public
   * @param {IShare.JwtPayload} user
   * @param {CoordQueryDto} coordQueryDto
   * @returns {Promise<IShare.IResponseBase<IShare.ILocationCoordResponseBase<ICoordQueryRange[] | ICoordQuerySpecifc[]>> | HttpException>}
   */
  public async getLocationByCoords(user: IShare.JwtPayload, coordQueryDto: CoordQueryDto): Promise<IShare.IResponseBase<IShare.ILocationCoordResponseBase<ICoordQueryRange[] | ICoordQuerySpecifc[]>> | HttpException> {
    // if can not recognize user payload licence then throw not acceptable
    if (!Object.values(ELicence).includes(user.licence as ELicence)) {
      this.logger.error('Not acceptable licence', '', 'GetLocationByCoordsError');
      return new HttpException(
        {
          status: HttpStatus.NOT_ACCEPTABLE,
          error: 'Not acceptable licence',
        },
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    coordQueryDto.take = coordQueryDto.take ? Number(coordQueryDto.take) : 10;
    coordQueryDto.skip = coordQueryDto.skip ? Number(coordQueryDto.skip) : 0;
    try {
      const searchResult: ICoordQueryRange[] | ICoordQuerySpecifc[] = await this.locationRepository.getLocationByCoords(coordQueryDto);
      if (!searchResult) {
        this.logger.error(`Location not found for lat ${coordQueryDto.lat} and lon ${coordQueryDto.lon}`, '', 'GetLocationByCoordsError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Location not found for lat ${coordQueryDto.lat} and lon ${coordQueryDto.lon}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.httPResponse.StatusOK({
        searchResult,
        take: coordQueryDto.take,
        skip: coordQueryDto.skip,
        count: searchResult.length,
      });
    } catch (error) {
      this.logger.error(error.message, '', 'GetLocationByCoordsError');
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
