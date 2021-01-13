import { ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Like, Repository } from 'typeorm';
import { CoordQueryDto, CreateLocationDto, GetLocationById } from './dto';
import { Country, Location } from './relations';
import { IFindByIdQuery, ICoordQuerySpecifc, ICoordQueryRange } from './interfaces';
import { IQueryPaging, ISearch } from '../interfaces';
import { config } from '../../config';
import { ELocationType } from './enums';

@EntityRepository(Location)
export class LocationRepository extends Repository<Location> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('LocationRepository');

  /**
   *
   * @param createLocationDto
   */
  protected async createCountry(countryName: string, countryCode: string): Promise<Country> {
    const country = new Country();
    country.name = countryName;
    country.code = countryCode;
    try {
      return await country.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Create location but not open yet
   * @protected
   * @param {CreateLocationDto} createLocationDto
   * @returns {Promise<Location>}
   */
  protected async createLocation(createLocationDto: CreateLocationDto): Promise<Location> {
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
    `

    if (searchReq.locationName.length > 0) {
      searchQuery += `and location."locationName" like '%${searchReq.locationName}%'`
    }

    if (searchReq.countryName.length > 0) {
      searchQuery += `and pc."name" like '%${searchReq.countryName}%'`
    }

    searchQuery += `
      order by location."updatedAt" ${searchReq.sort}
      limit ${take}
      offset ${skip}
    `

    try {
      const result: Location[] = await this.repoManager.query(searchQuery);

      return {
        locations: result,
        take,
        skip,
        count: Number(result[0] ? result[0]['cnt'] : '0'),
      };
    } catch (error) {
      this.logger.log(error.message)
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
        limit ${coordQueryDto.take}
        offset ${coordQueryDto.skip}
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
      `;
    }

    return new Promise<ICoordQuerySpecifc[] | ICoordQueryRange[]>((resolve, reject) => {
      this.repoManager
        .query(queryContent)
        .then((res) => resolve(res))
        .catch((err) => {
          this.logger.log(err.message)
          reject(err.message)
        });
    });
  }
}
