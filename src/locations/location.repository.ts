import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  EntityManager,
  EntityRepository,
  getManager,
  Repository,
} from 'typeorm';
import { CreateLocationDto } from './dto';
import { Location } from './location.entity';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');

  async createLocation(
    createLocationDto: CreateLocationDto,
  ): Promise<Location> {
    const { locationName, lat, lon, type, country } = createLocationDto;
    const location = new Location();
    location.locationName = locationName;
    location.lat = lat;
    location.lon = lon;
    location.type = type;
    if (country) location.country = country;
    location.point = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
      location.srid = {
        type: 'Point',
        coordinates: [location.lon, location.lat],
      };
    try {
      await location.save();
    } catch (error) {
      if (error.code === '23505') {
        // throw 409 error when duplicate username
        throw new ConflictException(
          `LocationName: ${locationName} already exists`,
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
    return location;
  }
}
