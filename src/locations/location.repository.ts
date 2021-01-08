import { ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { CreateLocationDto, GetLocationById } from './dto';
import { Location } from './location.entity';
import { IFindByIdQuery } from './interfaces';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');

  async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
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
    location.pointSrid = {
      type: 'Point',
      coordinates: [location.lon, location.lat],
    };
    try {
      await location.save();
    } catch (error) {
      if (error.code === '23505') {
        // throw 409 error when duplicate LocationName
        throw new ConflictException(`LocationName: ${locationName} already exists`);
      } else {
        throw new InternalServerErrorException();
      }
    }
    return location;
  }

  /**
   * @description Get location by primary key
   * @public
   * @param {GetLocationById} getLocationById
   * @returns {Promise<Location>}
   */
  async getLocationById(getLocationById: GetLocationById): Promise<Location> {
    const { id } = getLocationById;
    const findOpts: IFindByIdQuery = {
      where: {
        id,
      },
    };
    try {
      const location: Location = await this.findOne(findOpts);
      if (!location) throw new NotFoundException();
      return location;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
