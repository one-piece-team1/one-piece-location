import { ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Like, Repository } from 'typeorm';
import { CreateLocationDto, GetLocationById } from './dto';
import { Location } from './location.entity';
import { IFindByIdQuery } from './interfaces';
import { IQueryPaging, ISearch } from '../interfaces';

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

  async getLocationsWithNameSearch(searchReq: ISearch): Promise<{ locations: Location[]; count: number; take: number; skip: number }> {
    const take: number = searchReq.take ? Number(searchReq.take) : 10;
    const skip: number = searchReq.skip ? Number(searchReq.skip) : 0;

    const searchOpts: IQueryPaging = {
      take,
      skip,
      select: ['id', 'locationName', 'type', 'country', 'lat', 'lon'],
      order: {
        updatedAt: searchReq.sort,
      },
      where: {},
    };

    if (searchReq.keyword.length > 0) {
      searchOpts.where.locationName = Like('%' + searchReq.keyword + '%');
    }

    try {
      const [locations, count] = await this.repoManager.findAndCount(Location, searchOpts);
      return {
        locations,
        take,
        skip,
        count,
      };
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
