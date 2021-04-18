import { Test } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { Location, Country } from '../../locations/relations';
import { LocationService } from '../../locations/location.service';
import { LocationRepository } from '../../locations/location.repository';
import * as ELocation from '../../locations/enums';
import { ICoordQuerySpecifc } from '../../locations/interfaces';
import { HttpException, HttpStatus } from '@nestjs/common';

interface IServerCustomExpcetion {
  status: number;
  error: string;
}

describe('# Location Service', () => {
  let locationService: LocationService;
  let locationRepository: LocationRepository;
  let mockLocation: Location;
  let mockCoordQuerySpecifc: ICoordQuerySpecifc;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: LocationRepository,
          useValue: {
            getLocationById: jest.fn(),
            getLocationsWithNameSearch: jest.fn(),
            getLocationByCoords: jest.fn(),
          },
        },
      ],
    }).compile();

    locationService = module.get<LocationService>(LocationService);
    locationRepository = module.get<LocationRepository>(LocationRepository);

    const country = new Country();
    country.id = uuidv4();
    country.name = 'libtest1';
    country.code = 'lb1';
    mockLocation = new Location();
    mockLocation.id = uuidv4();
    mockLocation.point = {
      type: 'Point',
      coordinates: [11.09, 12.09],
    };
    mockLocation.pointSrid = {
      type: 'Point',
      coordinates: [11.09, 12.09],
    };
    mockLocation.lat = 11.09;
    mockLocation.lon = 12.09;
    mockLocation.type = ELocation.ELocationType.PORT;
    mockLocation.locationName = 'libtest1';
    mockLocation.country = country;

    mockCoordQuerySpecifc = {
      id: '',
      pointSrid: '',
      lat: 111.09098,
      lon: 111.33223,
      type: ELocation.ELocationType.PORT,
      locationName: '',
      country: '',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockLocation = null;
    mockCoordQuerySpecifc = null;
  });

  it('LocationService Should be defeined', () => {
    expect(locationService).toBeDefined();
  });

  describe('# Get Location By Id', () => {
    it('Should throw excetipion when user licence is malware', async (done: jest.DoneCallback) => {
      const result = await locationService.getLocationById({ username: 'test', licence: 'test' }, { id: '123' });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      expect(resultResponse.error).toEqual('Not acceptable licence');
      done();
    });

    it('Should return custom expection when location not found', async (done: jest.DoneCallback) => {
      locationRepository.getLocationById = jest.fn().mockReturnValue(undefined);
      const result = await locationService.getLocationById({ username: 'test', licence: 'onepiece' }, { id: '123' });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('Location 123 not found');
      done();
    });

    it('Should be able to resolve and return Location', async (done: jest.DoneCallback) => {
      locationRepository.getLocationById = jest.fn().mockReturnValue(mockLocation);
      const response = await locationService.getLocationById({ username: 'test', licence: 'onepiece' }, { id: '123' });
      expect(response.message).toEqual(mockLocation);
      done();
    });

    it('Should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      locationRepository.getLocationById = jest.fn().mockRejectedValue(new Error('Internal Server Error'));
      const result = await locationService.getLocationById({ username: 'test', licence: 'onepiece' }, { id: '123' });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Location With Search', () => {
    it('Should throw excetipion when user licence is malware', async (done: jest.DoneCallback) => {
      const result = await locationService.getLocationsWithNameSearch({ username: 'test', licence: 'test' }, {});
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      expect(resultResponse.error).toEqual('Not acceptable licence');
      done();
    });

    it('Should be able to resolve and return paging response', async (done: jest.DoneCallback) => {
      locationRepository.getLocationsWithNameSearch = jest.fn().mockReturnValue({ locations: [mockLocation], take: 10, skip: 0, count: 1 });
      const response = await locationService.getLocationsWithNameSearch({ username: 'test', licence: 'onepiece' }, {});
      expect(response.message['locations'] as Location[]).toEqual([mockLocation]);
      expect(response.message['take'] as number).toEqual(10);
      expect(response.message['skip'] as number).toEqual(0);
      expect(response.message['count'] as number).toEqual(1);
      done();
    });

    it('Should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      locationRepository.getLocationsWithNameSearch = jest.fn().mockRejectedValue(new Error('Internal Server Error'));
      const result = await locationService.getLocationsWithNameSearch({ username: 'test', licence: 'onepiece' }, {});
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });

  describe('# Get Location by Coords', () => {
    it('Should throw excetipion when user licence is malware', async (done: jest.DoneCallback) => {
      const result = await locationService.getLocationByCoords({ username: 'test', licence: 'test' }, { lat: 111.09098, lon: 111.33223, method: ELocation.ELocationCoordQueryMethod.SPECIFIC });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_ACCEPTABLE);
      expect(resultResponse.error).toEqual('Not acceptable licence');
      done();
    });

    it('Should return custom expection when locations not found', async (done: jest.DoneCallback) => {
      locationRepository.getLocationByCoords = jest.fn().mockReturnValue(undefined);
      const result = await locationService.getLocationByCoords({ username: 'test', licence: 'onepiece' }, { lat: 111.09098, lon: 111.33223, method: ELocation.ELocationCoordQueryMethod.SPECIFIC });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('Location not found for lat 111.09098 and lon 111.33223');
      done();
    });

    it('Should return and resolve coords range or specific query', async (done: jest.DoneCallback) => {
      locationRepository.getLocationByCoords = jest.fn().mockReturnValue([mockCoordQuerySpecifc]);
      const response = await locationService.getLocationByCoords({ username: 'test', licence: 'onepiece' }, { lat: 111.09098, lon: 111.33223, method: ELocation.ELocationCoordQueryMethod.SPECIFIC });
      expect(response.message['searchResult'] as ICoordQuerySpecifc[]).toEqual([mockCoordQuerySpecifc]);
      expect(response.message['take'] as number).toEqual(10);
      expect(response.message['skip'] as number).toEqual(0);
      expect(response.message['count'] as number).toEqual(1);
      done();
    });

    it('Should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
      locationRepository.getLocationByCoords = jest.fn().mockRejectedValue(new Error('Internal Server Error'));
      const result = await locationService.getLocationByCoords({ username: 'test', licence: 'onepiece' }, { lat: 111.09098, lon: 111.33223, method: ELocation.ELocationCoordQueryMethod.SPECIFIC });
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });
  });
});
