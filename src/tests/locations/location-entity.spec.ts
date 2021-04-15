import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Repository, createConnection, getRepository, Connection } from 'typeorm';
import { Country, Location } from '../../locations/relations';
import * as ELocation from '../../locations/enums';

describe('# Location Entity', () => {
  let connection: Connection;
  let locationRepository: Repository<Location>;
  let countryRepostiory: Repository<Country>;
  let testingModule: TestingModule;
  let id: string = '';

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Location),
          useClass: Repository,
        },
      ],
    }).compile();

    connection = await createConnection({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'onepiece-test',
      entities: [Location, Country],
      synchronize: true,
      dropSchema: true,
      logging: false,
      name: 'testConnection',
    });
    locationRepository = getRepository(Location, 'testConnection');
    countryRepostiory = getRepository(Country, 'testConnection');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Create Location With Country', () => {
    it('Should be able to create location', async (done: jest.DoneCallback) => {
      id = uuidv4();
      const country = new Country();
      country.id = id;
      country.name = 'libtest1';
      country.code = 'lb1';
      const location = new Location();
      location.id = id;
      location.point = {
        type: 'Point',
        coordinates: [11.09, 12.09],
      };
      location.pointSrid = {
        type: 'Point',
        coordinates: [11.09, 12.09],
      };
      location.lat = 11.09;
      location.lon = 12.09;
      location.type = ELocation.ELocationType.PORT;
      location.locationName = 'libtest1';
      location.country = country;
      const result = await locationRepository.save(location);
      expect(result.id).toEqual(location.id);
      expect(result.point).toEqual(location.point);
      expect(result.pointSrid).toEqual(location.pointSrid);
      expect(result.lat).toEqual(location.lat);
      expect(result.lon).toEqual(location.lon);
      expect(result.type).toEqual(location.type);
      expect(result.locationName).toEqual(location.locationName);
      expect(result.country.id).toEqual(id);
      expect(result.country.name).toEqual(country.name);
      expect(result.country.code).toEqual(country.code);
      expect(result.version).toEqual(1);
      done();
    });
  });

  describe('Get Location By Id', () => {
    it('Should be able to get location', async (done: jest.DoneCallback) => {
      const location = await locationRepository.findOne({ where: { id }, relations: ['country'] });
      expect(location.id).toEqual(id);
      expect(location.locationName).toEqual('libtest1');
      expect(location.country.code).toEqual('lb1');
      done();
    });
  });

  describe('Update Location By Id', () => {
    it('Should be able to update location', async (done: jest.DoneCallback) => {
      const location = await locationRepository.findOne({ where: { id }, relations: ['country'] });
      location.locationName = 'lib2';
      const result = await locationRepository.save(location);
      expect(result.locationName).toEqual(location.locationName);
      expect(result.version).toEqual(2);
      done();
    });
  });

  describe('Delete Location By Id', () => {
    it('Should be able to delete locaiton', async (done: jest.DoneCallback) => {
      const result = await locationRepository.delete({ id });
      const location = await locationRepository.findOne({ where: { id } });
      const country = await countryRepostiory.findOne({ where: { id } });
      expect(result.affected).toEqual(1);
      expect(location).toEqual(undefined);
      expect(country).not.toEqual(undefined);
      done();
    });
  });
});
