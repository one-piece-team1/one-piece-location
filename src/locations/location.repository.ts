import { ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Like, Repository } from 'typeorm';
import { CoordQueryDto, CreateLocationDto, GetLocationById } from './dto';
import { Location } from './location.entity';
import { IFindByIdQuery, ICoordQuerySpecifc, ICoordQueryRange } from './interfaces';
import { IQueryPaging, ISearch } from '../interfaces';
import { config } from '../../config';
import { ELocationType } from './enums';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');

  /**
   * @description Create location but not open yet
   * @protected
   * @param {CreateLocationDto} createLocationDto
   * @returns {Promise<Location>}
   */
  protected async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
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
  public async getLocationById(getLocationById: GetLocationById): Promise<Location> {
    const { id } = getLocationById;
    // currently only allow to search, will open other type search in the future
    const type: ELocationType.PORT = 'port' as ELocationType.PORT;
    const findOpts: IFindByIdQuery = {
      where: {
        id,
        type,
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

  /**
   * @description Get location with name search and supporting pagination query
   * @public
   * @param {ISearch} searchReq
   * @returns {Promise<{ locations: Location[]; count: number; take: number; skip: number }>}
   */
  public async getLocationsWithNameSearch(searchReq: ISearch): Promise<{ locations: Location[]; count: number; take: number; skip: number }> {
    const take: number = searchReq.take ? Number(searchReq.take) : 10;
    const skip: number = searchReq.skip ? Number(searchReq.skip) : 0;
    // currently only allow to search, will open other type search in the future
    const type: ELocationType.PORT = 'port' as ELocationType.PORT;

    const searchOpts: IQueryPaging = {
      take,
      skip,
      select: ['id', 'locationName', 'type', 'country', 'lat', 'lon'],
      order: {
        updatedAt: searchReq.sort,
      },
      where: {
        type,
      },
    };

    if (searchReq.locationName.length > 0) {
      searchOpts.where.locationName = Like('%' + searchReq.locationName + '%');
    }

    if (searchReq.countryCode.length > 0) {
      searchOpts.where.country = Like('%' + searchReq.countryCode + '%');
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

  /**
   * @description Search Location with geo data
   * @public
   * @param {CoordQueryDto} coordQueryDto
   * @returns {ICoordQuerySpecifc[] | ICoordQueryRange[]}
   */
  public async getLocationByCoords(coordQueryDto: CoordQueryDto): Promise<ICoordQuerySpecifc[] | ICoordQueryRange[]> {
    const { lat, lon, method } = coordQueryDto;
    let queryContent = '';

    if (method === 'range') {
      // represent kilometers for line distrance not
      if (!coordQueryDto.range) coordQueryDto.range = 1;
      queryContent = `
        with searhResult as (
          select
            "id",
            "pointSrid",
            "lat",
            "lon",
            "type",
            "locationName",
            "country",
            (6371 * acos(cos(radians(${lat})) * cos(radians("lat"::float)) * cos(radians("lon"::float) - radians(${lon}) ) + sin(radians(${lat})) * sin(radians("lat"::float)))) as kilodistance
          from public.location
          where
            ${coordQueryDto.range} > power(power("lat" - ${lat}, 2) + power("lon" - ${lon}, 2), .5) AND type = 'port'
          group by "id"
        )
        select
          *,
          "kilodistance" * 0.62 as mileDistance
        from searhResult
        order by "kilodistance" ASC
        limit ${coordQueryDto.take}
        offset ${coordQueryDto.skip}
      `;
    } else {
      queryContent = `
        select
          "id",
          "pointSrid",
          "lat",
          "lon",
          "type",
          "locationName",
          "country"
        from ${config.DB_SETTINGS.schema}.${config.DB_SETTINGS.table}
        where "lat" = ${lat}
          and "lon" = ${lon}
          and "type" = 'port'
      `;
    }

    return new Promise<ICoordQuerySpecifc[] | ICoordQueryRange[]>((resolve, reject) => {
      this.repoManager
        .query(queryContent)
        .then((res) => resolve(res))
        .catch((err) => reject(err.message));
    });
  }
}
