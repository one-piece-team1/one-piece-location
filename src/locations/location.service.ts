import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload } from 'strategy/interfaces';
import { GetLocationById } from './dto';
import { ResponseBase } from './interfaces';
import { LocationRepository } from './location.repository';

@Injectable()
export class LocationService {
  private readonly logger: Logger = new Logger('LocationService');

  constructor(@InjectRepository(LocationRepository) private locationRepository: LocationRepository) {}

  public async getRequest(): Promise<string> {
    return 'Hello World!';
  }

  public async getLocationById(user: JwtPayload, getLocationById: GetLocationById): Promise<ResponseBase> {
    console.log('user: ', user);
    try {
      const location = await this.locationRepository.getLocationById(getLocationById);

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
}
