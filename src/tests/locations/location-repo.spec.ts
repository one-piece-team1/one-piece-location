import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Location, Country } from '../../locations/relations';
import { LocationRepository } from '../../locations/location.repository';
import { testOrmconfig } from '../../config/orm.config';
import { ELocationType, ELocationCoordQueryMethod } from '../../locations/enums';

describe('# Location Repository', () => {
  let connection: Connection;
  let locationRepository: LocationRepository;
  let id: string = '';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(LocationRepository),
          useClass: LocationRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([Location, Country]));
    Location.useConnection(connection);
    Country.useConnection(connection);
    locationRepository = await module.get(getCustomRepositoryToken(LocationRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('# Create Country', () => {
    it('Should be able to create country without Error', async (done: jest.DoneCallback) => {
      const result = await locationRepository.createCountry('test1', 't1');
      expect(result.name).toEqual('test1');
      expect(result.code).toEqual('t1');
      done();
    });

    it('Should not be able to create same country', async (done: jest.DoneCallback) => {
      try {
        await locationRepository.createCountry('test1', 't1');
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(duplicate|violates|unique)/gi);
      }
      done();
    });
  });

  describe('# Create Location', () => {
    it('Should be able to create location without Error', async (done: jest.DoneCallback) => {
      const localeDto = {
        locationName: 'test1',
        lat: 11.09,
        lon: 12.09,
        type: ELocationType.PORT,
        countryName: 'test2',
        countryCode: 't2',
      };
      const result = await locationRepository.createLocation(localeDto);
      id = result.id;
      expect(result.locationName).toEqual(localeDto.locationName);
      expect(result.lat).toEqual(localeDto.lat);
      expect(result.lon).toEqual(localeDto.lon);
      expect(result.type).toEqual(ELocationType.PORT);
      expect(result.pointSrid.coordinates[0]).toEqual(localeDto.lon);
      expect(result.pointSrid.coordinates[1]).toEqual(localeDto.lat);
      done();
    });

    it('Should not be able to create location when same country code already existed', async (done: jest.DoneCallback) => {
      const localeDto = {
        locationName: 'test1',
        lat: 11.09,
        lon: 12.09,
        type: ELocationType.PORT,
        countryName: 'test2',
        countryCode: 't2',
      };
      try {
        await locationRepository.createLocation(localeDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(duplicate|violates|unique)/gi);
      }
      done();
    });

    it('Should not able to create location when same locationName already existed', async (done: jest.DoneCallback) => {
      const localeDto = {
        locationName: 'test1',
        lat: 11.09,
        lon: 12.09,
        type: ELocationType.PORT,
        countryName: 'test3',
        countryCode: 't3',
      };
      try {
        await locationRepository.createLocation(localeDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(duplicate|violates|unique)/gi);
      }
      done();
    });

    it('Should not able to create location when connection lost', async (done: jest.DoneCallback) => {
      const localeDto = {
        locationName: 'test1',
        lat: 11.09,
        lon: 12.09,
        type: ELocationType.PORT,
        countryName: 'test3',
        countryCode: 't3',
      };
      await connection.driver.disconnect();
      try {
        await locationRepository.createLocation(localeDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(connect|undefined)/gi);
      }
      await connection.driver.connect();
      done();
    });
  });

  describe('# Get Location By Id', () => {
    it("Should not be able to get location when it's not existed", async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await locationRepository.getLocationById({ id });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toEqual(`Location ${id} not found`);
      }
      done();
    });

    it('Should not be able to get location when id is not an uuid', async (done: jest.DoneCallback) => {
      const id = '123';
      try {
        await locationRepository.getLocationById({ id });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(input|type|uuid)/gi);
      }
      done();
    });

    it("Should be able to get location when it's existed", async (done: jest.DoneCallback) => {
      const locale = await locationRepository.getLocationById({ id });
      expect(locale.locationName).toEqual('test1');
      expect(locale.lat).toEqual(11.09);
      expect(locale.lon).toEqual(12.09);
      expect(locale.type).toEqual(ELocationType.PORT);
      expect(locale.pointSrid.coordinates[0]).toEqual(12.09);
      expect(locale.pointSrid.coordinates[1]).toEqual(11.09);
      done();
    });
  });

  describe('# Location Name Search ', () => {
    it('Should be able to search location by default', async (done: jest.DoneCallback) => {
      const { locations, take, skip, count } = await locationRepository.getLocationsWithNameSearch({ sort: 'DESC' });
      expect(take).toEqual(10);
      expect(skip).toEqual(0);
      expect(count).toEqual(1);
      expect(locations[0].locationName).toEqual('test1');
      done();
    });

    it('Should be able to search location with exited locationName', async (done: jest.DoneCallback) => {
      const { locations, take, skip, count } = await locationRepository.getLocationsWithNameSearch({ sort: 'DESC', locationName: 'test1' });
      expect(take).toEqual(10);
      expect(skip).toEqual(0);
      expect(count).toEqual(1);
      expect(locations[0].locationName).toEqual('test1');
      done();
    });

    it('Should be able to search location with exited locationName', async (done: jest.DoneCallback) => {
      const { locations, take, skip, count } = await locationRepository.getLocationsWithNameSearch({ sort: 'DESC', countryName: 'test2' });
      expect(take).toEqual(10);
      expect(skip).toEqual(0);
      expect(count).toEqual(1);
      expect(locations[0].locationName).toEqual('test1');
      done();
    });

    it('Should able to receive empty list when countryName not existed', async (done: jest.DoneCallback) => {
      const { locations, count } = await locationRepository.getLocationsWithNameSearch({ sort: 'DESC', countryName: 'test2123' });
      expect(count).toEqual(0);
      expect(locations.length).toEqual(0);
      done();
    });

    it('Should able to receive empty list when locationName not existed', async (done: jest.DoneCallback) => {
      const { locations, count } = await locationRepository.getLocationsWithNameSearch({ sort: 'DESC', locationName: 'test2123' });
      expect(count).toEqual(0);
      expect(locations.length).toEqual(0);
      done();
    });

    it('Should reject with error when sort is not provided', async (done: jest.DoneCallback) => {
      try {
        await locationRepository.getLocationsWithNameSearch({ countryName: 'test2' });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(syntax|error)/gi);
      }
      done();
    });
  });

  describe('# Location Coords Search', () => {
    it('Should be able to get specific coords search', async (done: jest.DoneCallback) => {
      const qDto = {
        lat: 11.09,
        lon: 12.09,
        method: ELocationCoordQueryMethod.SPECIFIC,
      };
      const locales = await locationRepository.getLocationByCoords(qDto);
      expect(locales[0].locationName).toEqual('test1');
      expect(locales[0].lat).toEqual(11.09);
      expect(locales[0].lon).toEqual(12.09);
      expect(locales[0].type).toEqual(ELocationType.PORT);
      expect(typeof locales[0].pointSrid).toEqual('string');
      done();
    });

    it('Should not be able to get specifc coords search when coord not found', async (done: jest.DoneCallback) => {
      const qDto = {
        lat: 112.09,
        lon: 123.09,
        method: ELocationCoordQueryMethod.SPECIFIC,
      };
      const locales = await locationRepository.getLocationByCoords(qDto);
      expect(locales.length).toEqual(0);
      done();
    });

    it('Should be able to get range coords search', async (done: jest.DoneCallback) => {
      const qDto = {
        lat: 11.09,
        lon: 12.09,
        method: ELocationCoordQueryMethod.RANGE,
        range: 15,
        take: 10,
        skip: 0,
      };
      const locales = await locationRepository.getLocationByCoords(qDto);
      expect(locales.length).toEqual(1);
      expect(locales[0].locationName).toEqual('test1');
      expect(locales[0].lat).toEqual(11.09);
      expect(locales[0].lon).toEqual(12.09);
      expect(locales[0].type).toEqual(ELocationType.PORT);
      done();
    });

    it('Should get rejection when take or skip is minus', async (done: jest.DoneCallback) => {
      const qDto = {
        lat: 11.09,
        lon: 12.09,
        method: ELocationCoordQueryMethod.RANGE,
        range: 0,
        take: -20,
        skip: 0,
      };
      try {
        await locationRepository.getLocationByCoords(qDto);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toMatch(/(string|object)/gi);
      }
      done();
    });
  });
});
