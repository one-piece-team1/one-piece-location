import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../app.module';
import { JwtStrategy } from '../../strategy/jwt-strategy';
import { LocationService } from '../../locations/location.service';
import { LocationRepository } from '../../locations/location.repository';
import { Location, Country } from '../../locations/relations';
import { config } from '../../../config';
import * as ELocation from '../../locations/enums';
import * as IShare from '../../interfaces';
import { ICoordQuerySpecifc, ICoordQueryRange } from '../../locations/interfaces';

interface IValidatorError {
  error?: string;
}

type TBody = IShare.IResponseBase<any> & IValidatorError;

interface ITestResponse {
  body: TBody;
}

function MockLocation(mockLocation: Location): Location {
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
  return mockLocation;
}

function MockCoordQuerySpecific(): ICoordQuerySpecifc {
  return {
    id: '',
    pointSrid: '',
    lat: 111.09098,
    lon: 111.33223,
    type: ELocation.ELocationType.PORT,
    locationName: '',
    country: '',
  };
}

function MockCoordQueryRange(): ICoordQueryRange {
  return {
    id: '',
    pointSrid: '',
    lat: 111.09098,
    lon: 111.33223,
    type: ELocation.ELocationType.PORT,
    locationName: '',
    country: '',
    kilodistance: 0.4,
    miledistance: 0.1,
  };
}

describe('# App', () => {
  const testToken: string = process.env.TESTTOKEN;
  let app: INestApplication;
  let jwtStrategy: JwtStrategy;
  let locationService: LocationService;
  let locationRepository: LocationRepository;
  let mockValideUser: IShare.JwtPayload;
  let mockInvalidUser: IShare.JwtPayload;
  // mock data area
  let mockLocation: Location;
  let mockCoordQuerySpecifc: ICoordQuerySpecifc;
  let mockCoordQueryRange: ICoordQueryRange;
  const mockId = '735ca6d1-7a2f-45b5-bce7-42706751d12e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: JwtStrategy,
          useValue: {
            validate: jest.fn(),
          },
        },
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

    jwtStrategy = moduleFixture.get<JwtStrategy>(JwtStrategy);
    locationService = moduleFixture.get<LocationService>(LocationService);
    locationRepository = moduleFixture.get<LocationRepository>(LocationRepository);
    mockValideUser = {
      id: '',
      username: 'test',
      licence: 'onepiece',
      email: '',
      role: 'admin',
    };
    mockInvalidUser = {
      id: '',
      username: 'test',
      licence: 'test',
      email: '',
      role: 'admin',
    };
    app = moduleFixture.createNestApplication();
    await app.listen(config.PORT);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('# Health Check', () => {
    it('Should be able to return with success health status', (done) => {
      return request(app.getHttpServer())
        .get('/healths')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, {
          status: 'ok',
          info: {
            'location-turn': {
              status: 'up',
            },
          },
          error: {},
          details: {
            'location-turn': {
              status: 'up',
            },
          },
        })
        .then(() => done())
        .catch((err) => done(err));
    });
  });

  describe('Location Controller Integration', () => {
    describe('# (GET) /locations', () => {
      beforeEach(() => {
        mockLocation = MockLocation(mockLocation);
      });

      afterEach(() => {
        jest.resetAllMocks();
        mockLocation = null;
      });

      it('# should return error when user is not a valid licence issuer', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(406);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toEqual('Not acceptable licence');
        done();
      });

      it('# should be able to resolve and return paging response', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationsWithNameSearch = jest.fn().mockReturnValue({ locations: [mockLocation], take: 10, skip: 0, count: 1 });
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.message['locations'] as Location[]).toEqual([mockLocation]);
        expect(res.body.message['take'] as number).toEqual(10);
        expect(res.body.message['skip'] as number).toEqual(0);
        expect(res.body.message['count'] as number).toEqual(1);
        done();
      });

      it('# should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationsWithNameSearch = jest.fn().mockRejectedValue('Server Error');
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(500);
        expect(res.body.message).toMatch(/(Internal|Server|Error)/gi);
        done();
      });
    });

    describe('# (GET) /locations/coordinates', () => {
      beforeEach(() => {
        mockLocation = MockLocation(mockLocation);
        mockCoordQuerySpecifc = MockCoordQuerySpecific();
        mockCoordQueryRange = MockCoordQueryRange();
      });

      afterEach(() => {
        jest.resetAllMocks();
        mockLocation = null;
        mockCoordQuerySpecifc = null;
        mockCoordQueryRange = null;
      });

      it('# should return error when dto lat is not valid', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/coordinates')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(400);
        expect(res.body.error).toEqual('Bad Request');
        expect(res.body.message[0] as string).toMatch(/(lat|must|number|string)/gi);
        expect(res.body.message[1] as string).toMatch(/(lon|must|number|string)/gi);
        expect(res.body.message[2] as string).toMatch(/(method|must|specific,range)/gi);
        done();
      });

      it('# should return and resolve coords specific query', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationByCoords = jest.fn().mockReturnValue(undefined);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/coordinates')
          .query({
            lat: mockCoordQuerySpecifc.lat.toString(),
            lon: mockCoordQuerySpecifc.lon.toString(),
            method: 'specific',
          })
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(404);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toEqual(`Location not found for lat ${mockCoordQuerySpecifc.lat} and lon ${mockCoordQuerySpecifc.lon}`);
        done();
      });

      it('# should return and resolve coords specific query', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationByCoords = jest.fn().mockReturnValue(undefined);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/coordinates')
          .query({
            lat: mockCoordQuerySpecifc.lat.toString(),
            lon: mockCoordQuerySpecifc.lon.toString(),
            method: 'specific',
          })
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(404);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toEqual(`Location not found for lat ${mockCoordQuerySpecifc.lat} and lon ${mockCoordQuerySpecifc.lon}`);
        done();
      });

      it('# return and resolve coords range query', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationByCoords = jest.fn().mockReturnValue([mockCoordQueryRange]);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/coordinates')
          .query({
            lat: mockCoordQueryRange.lat.toString(),
            lon: mockCoordQueryRange.lon.toString(),
            method: 'range',
            range: 1,
          })
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.message['searchResult'] as ICoordQuerySpecifc[]).toEqual([mockCoordQueryRange]);
        expect(res.body.message['take'] as number).toEqual(10);
        expect(res.body.message['skip'] as number).toEqual(0);
        expect(res.body.message['count'] as number).toEqual(1);
        done();
      });

      it('# should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationByCoords = jest.fn().mockRejectedValue('Server Error');
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/coordinates')
          .query({
            lat: mockCoordQuerySpecifc.lat.toString(),
            lon: mockCoordQuerySpecifc.lon.toString(),
            method: 'specific',
          })
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(500);
        expect(res.body.message).toMatch(/(Internal|Server|Error)/gi);
        done();
      });
    });

    describe('# (GET) /locations/:id', () => {
      beforeEach(() => {
        mockLocation = MockLocation(mockLocation);
      });

      afterEach(() => {
        jest.resetAllMocks();
        mockLocation = null;
      });

      it('# should return error when user is not a valid licence issuer', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        const res: ITestResponse = await request(app.getHttpServer())
          .get('/locations/123')
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(400);
        expect(res.body.message[0] as string).toMatch(/(id|uuid)/gi);
        done();
      });

      it('# should return error when user is not a valid licence issuer', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockInvalidUser);
        const res: ITestResponse = await request(app.getHttpServer())
          .get(`/locations/${mockId}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(406);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toEqual('Not acceptable licence');
        done();
      });

      it('# should return custom expection when location not found', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationById = jest.fn().mockReturnValue(undefined);
        const res: ITestResponse = await request(app.getHttpServer())
          .get(`/locations/${mockId}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(404);
        expect(res.body.status).toEqual('error');
        expect(res.body.message).toEqual(`Location ${mockId} not found`);
        done();
      });

      it('# should be able to resolve and return Location', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationById = jest.fn().mockReturnValue(mockLocation);
        const res: ITestResponse = await request(app.getHttpServer())
          .get(`/locations/${mockId}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.message).toEqual(mockLocation);
        done();
      });

      it('# should return internal server error when exception is caught', async (done: jest.DoneCallback) => {
        jwtStrategy.validate = jest.fn().mockReturnValue(mockValideUser);
        locationRepository.getLocationById = jest.fn().mockRejectedValue('Server Error');
        const res: ITestResponse = await request(app.getHttpServer())
          .get(`/locations/${mockId}`)
          .set('Authorization', `Bearer ${testToken}`);
        expect(res.body.statusCode).toEqual(500);
        expect(res.body.message).toMatch(/(Internal|Server|Error)/gi);
        done();
      });
    });
  });
});
