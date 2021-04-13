import { ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, getRepository, Repository } from 'typeorm';
import { Country, Location } from './relations';
import { CoordQueryDto, CreateLocationDto, GetLocationById } from './dto';
import { IFindByIdQuery, ICoordQuerySpecifc, ICoordQueryRange } from './interfaces';
import { ISearch } from '../interfaces';
import { ELocationType } from './enums';
import { config } from '../../config';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  // jest default NODE_ENV is test
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
  private readonly logger: Logger = new Logger('LocationRepository');

  /**
   * @description Create Country
   * @public
   * @param {string} countryName
   * @param {string} countryCode
   * @returns {Promise<Country>}
   */
  public async createCountry(countryName: string, countryCode: string): Promise<Country> {
    const country = new Country();
    country.name = countryName;
    country.code = countryCode;
    try {
      return await country.save();
    } catch (error) {
      this.logger.error(error.message, '', 'CreateCountryError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Create location but not open yet
   * @public
   * @param {CreateLocationDto} createLocationDto
   * @returns {Promise<Location>}
   */
  public async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
    const { locationName, lat, lon, type, countryName, countryCode } = createLocationDto;
    const location = new Location();
    location.locationName = locationName;
    location.lat = lat;
    location.lon = lon;
    location.type = type;
    if (countryCode && countryName) location.country = await this.createCountry(countryName, countryCode);
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
      this.logger.error(error.message, '', 'CreateLocationError');
      throw new InternalServerErrorException(error.message);
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
      const location: Location = await getRepository(Location, this.connectionName).findOne(findOpts);
      if (!location) throw new NotFoundException(`Location ${getLocationById.id} not found`);
      return location;
    } catch (error) {
      this.logger.error(error.message, '', 'GetLocationByIdError');
      throw new InternalServerErrorException(error.message);
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

    // const type: ELocationType.PORT = 'port' as ELocationType.PORT;

    let searchQuery = `
      select
        location.id,
        location."locationName" as "locationName",
        location.type,
        pc.code as "countryCode",
        pc.name as "countryName",
        location.lat as "latitude",
        location.lon as "lontitude",
        count(*) OVER() AS "cnt"
      from 
        public.location
      left join public.country pc on pc.id = location."countryId"
      where 
        location.type = 'port'
    `;

    if (searchReq.locationName && searchReq.locationName.length > 0) {
      searchQuery += `and location."locationName" like '%${searchReq.locationName}%'`;
    }

    if (searchReq.countryName && searchReq.countryName.length > 0) {
      searchQuery += `and pc."name" like '%${searchReq.countryName}%'`;
    }

    searchQuery += `
      order by location."updatedAt" ${searchReq.sort}
      limit ${take}
      offset ${skip}
    `;

    try {
      const result: Location[] = await getRepository(Location, this.connectionName).query(searchQuery);

      return {
        locations: result,
        take,
        skip,
        count: Number(result[0] ? result[0]['cnt'] : '0'),
      };
    } catch (error) {
      this.logger.error(error.message, '', 'GetLocationsWithNameSearchError');
      throw new InternalServerErrorException(error.message);
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
    const take: number = coordQueryDto.take ? Number(coordQueryDto.take) : 10;
    const skip: number = coordQueryDto.skip ? Number(coordQueryDto.skip) : 0;
    let queryContent = '';

    if (method === 'range') {
      // represent kilometers for line distrance not
      if (!coordQueryDto.range) coordQueryDto.range = 1;
      queryContent = `
        with searchResult as (
          select
            "id",
            "pointSrid",
            "lat",
            "lon",
            "type",
            "locationName",
            "countryId",
            (6371 * acos(cos(radians(${lat})) * cos(radians("lat"::float)) * cos(radians("lon"::float) - radians(${lon}) ) + sin(radians(${lat})) * sin(radians("lat"::float)))) as kilodistance
          from 
            public.location
          where
            ${coordQueryDto.range} > power(power("lat" - ${lat}, 2) + power("lon" - ${lon}, 2), .5) AND type = 'port'
          group by "id"
        )
        select
          *,
          "kilodistance" * 0.62 as mileDistance
        from 
          searchResult
        left join public.country pc on pc.id = searchResult."countryId"
        order by "kilodistance" ASC
        limit ${take}
        offset ${skip}
      `;
    } else {
      queryContent = `
        with searchResult as (
          select
            "id",
            "pointSrid",
            "lat",
            "lon",
            "type",
            "locationName",
            "countryId"
          from 
            public.location
          where "lat" = ${lat}
            and "lon" = ${lon}
            and "type" = 'port'
        )
        select
          *
        from searchResult
        left join public.country pc on pc.id = searchResult."countryId"
        limit ${take}
        offset ${skip}
      `;
    }

    return new Promise<ICoordQuerySpecifc[] | ICoordQueryRange[]>((resolve, reject) => {
      getRepository(Location, this.connectionName)
        .query(queryContent)
        .then((res) => resolve(res))
        .catch((err) => {
          this.logger.error(err.message, '', 'GetLocationByCoordsError');
          return reject(err);
        });
    });
  }
}
