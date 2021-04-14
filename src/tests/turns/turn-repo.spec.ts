import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getManager } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Turn } from '../../turns/turn.entity';
import { Location, Country } from '../../locations/relations';
import { TurnRepository } from '../../turns/turn.repository';
import { boostrap } from '../../libs/mock_turn';
import * as ELocation from '../../turns/enums';
import * as ITurn from '../../turns/interfaces';
import { testOrmconfig } from '../../config/orm.config';

interface IRouteMethodOption {
  type?: ELocation.EPlanType;
}

interface IRouteMethod {
  type: ELocation.EPlanType;
}

interface ISearchForPlanStartandEndPointDto extends IRouteMethodOption {
  startLocationName: string;
  endLocationName: string;
}

interface ISearchRoutePlansDto extends IRouteMethod {
  startNode: number;
  endNode: number;
}

function MockGenerateRoutesAsText(): ITurn.INetworkGeometryResponse[] {
  return [
    {
      id: 2265,
      name: 'a625nghvhpzn',
      geom: '0102000020E610000002000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B2072056554840',
      srid: '0102000020E610000002000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B2072056554840',
      length: 1.532,
      fromnode: 3555,
      tonode: 4771,
      version: 1,
      createdAt: '2021-04-14T14:31:03.211Z',
      updatedAt: '2021-04-14T14:31:03.211Z',
      seq: '1',
      path_seq: 1,
      node: '3555',
      edge: '2271',
      cost: 13.425,
      agg_cost: 0,
      route_legnth: 1.532023107881831,
      l_str: 'LINESTRING(-6.583310127 49.74998856,-5.5 48.66669083)',
      lineString: {
        type: 'LineString',
        coordinates: [
          [-6.583310127, 49.74998856],
          [-5.5, 48.66669083],
        ],
      },
    },
  ];
}

function MockGenerateRoutesAsLine(): ITurn.INetworkGeometryResponse[] {
  return [
    {
      l_str: '0102000020E610000017000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B207205655484000000000000034C0A17C0760FFFF484005B0F99F999925C0FB4F066066A64940EEFC0DA000003EC0A17C0760FFFF484000000000000044C0A17C0760FFFF4840EEFC0DA000003EC0A17C0760FFFF484005B0F99F99594AC0FB4F0660666647400000000000404AC08279024099D9474005B0F99F99594AC0FB4F0660666647400000000000004BC009A3FE1FCC0C474005B0F99F99594AC0FB4F06606666474005B0F99F99194EC0A17C0760FFDF47401F03052066A64DC009A3FE1FCC0C47406EA60020008050C0A17C0760FFFF48404DFEFEFF056050C08DA9054026E548401B1000A0B32E51C0BAFF0220F25948403B520120FCB351C0FBA6FADF5B6A4740494E0560ECAA52C087D20760BD8046406D7FFCDF30D552C0B428054009674640760A03E069DF52C000C103A0DD5A464010A10040C40553C07A54FCDF911F46405C78FBFF7A1053C04C98FE5FD4184640',
      lineString: {
        type: 'LineString',
        coordinates: [],
      },
    },
  ];
}

describe('# Turn Repo', () => {
  let connection: Connection;
  let turnRepository: TurnRepository;
  let id: string;

  // mock dto
  let mockSearchForPlanStartandEndPointDto: ISearchForPlanStartandEndPointDto;
  let mockSearchRoutePlansDto: ISearchRoutePlansDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(TurnRepository),
          useClass: TurnRepository,
        },
      ],
    }).compile();
    connection = await createConnection(testOrmconfig([Turn, Location, Country]));
    Turn.useConnection(connection);
    Location.useConnection(connection);
    Country.useConnection(connection);
    await boostrap();
    turnRepository = await module.get(getCustomRepositoryToken(TurnRepository));
  });

  afterEach(async () => {
    await connection.close();
  });

  it('TurnRepository should be created', () => {
    expect(turnRepository).toBeDefined();
  });

  describe('# Get Nearest Plan LineString data', () => {
    afterEach(() => {
      mockSearchForPlanStartandEndPointDto = null;
    });

    it('Should search with nearest result', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
      };
      const nearestNodes = await turnRepository.getNearestPlanLineString(mockSearchForPlanStartandEndPointDto);
      expect(nearestNodes.startNode).not.toEqual(undefined);
      expect(nearestNodes.endNode).not.toEqual(undefined);
      expect(nearestNodes.startNode.fromnode).toEqual(3555);
      expect(nearestNodes.endNode.fromnode).toEqual(26044);
      done();
    });

    it('Should throw error when dto is not satisfied', async (done: jest.DoneCallback) => {
      try {
        await turnRepository.getNearestPlanLineString(mockSearchForPlanStartandEndPointDto);
      } catch (error) {
        expect(error.message).toMatch(/(startLocationName|null)/gi);
      }
      done();
    });

    it('Should throw error when start and end nodes cannot be found', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
      };
      await getManager('testConnection').delete(Location, {});
      try {
        await turnRepository.getNearestPlanLineString(mockSearchForPlanStartandEndPointDto);
      } catch (error) {
        expect(error.message).toEqual('Target plan nodes not found');
      }
      done();
    });
  });

  describe('# Get Routes Planning', () => {
    afterEach(() => {
      mockSearchRoutePlansDto = null;
    });

    it('Should not be able to get routesing planning as Text', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      try {
        await turnRepository.getRoutesPlanning(mockSearchRoutePlansDto);
      } catch (error) {
        expect(error.message).toMatch(/(pgr_dijkstra|not|exist)/gi);
      }
      done();
    });

    it('Should not be able to get routesing planning as LINE', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.LINE,
      };
      try {
        await turnRepository.getRoutesPlanning(mockSearchRoutePlansDto);
      } catch (error) {
        expect(error.message).toMatch(/(pgr_dijkstra|not|exist)/gi);
      }
      done();
    });

    it('Should be able to get routesing planning as Text', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const plans = await turnRepository.getRoutesPlanning(mockSearchRoutePlansDto);
      expect(plans).not.toEqual(undefined);
      expect(plans[0].fromnode).toEqual(3555);
      expect(plans[0].tonode).toEqual(4771);
      done();
    });

    it('Should be able to get routesing planning as LINE', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const plans = await turnRepository.getRoutesPlanning(mockSearchRoutePlansDto);
      expect(plans).not.toEqual(undefined);
      expect(typeof plans[0].l_str).toEqual('string');
      expect(plans[0].lineString.type).toEqual('LineString');
      done();
    });
  });

  describe('# Generates Routes Planning', () => {
    afterEach(() => {
      mockSearchRoutePlansDto = null;
    });

    it('Should not be able to generates routesing planning when nodes not found', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
        type: ELocation.EPlanType.TEXT,
      };
      try {
        await turnRepository.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      } catch (error) {
        expect(error.message).toEqual('Target plan nodes not found');
      }
      done();
    });

    it('Should not be able to generates routesing planning when nodes not found', async (done: jest.DoneCallback) => {
      turnRepository.getNearestPlanLineString = jest.fn().mockReturnValue({ startNode: undefined, endNode: undefined });
      try {
        await turnRepository.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      } catch (error) {
        expect(error.message).toEqual('Unable to find to start point or end point');
      }
      done();
    });

    it('Should be able to generates routesing planning with text as result', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getNearestPlanLineString = jest.fn().mockReturnValue({ startNode: 1, endNode: 1 });
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const plans = await turnRepository.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      expect(plans).not.toEqual(undefined);
      expect(plans[0].fromnode).toEqual(3555);
      expect(plans[0].tonode).toEqual(4771);
      done();
    });

    it('Should be able to generates routesing planning with line as result', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: '',
        endLocationName: '',
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.getNearestPlanLineString = jest.fn().mockReturnValue({ startNode: 1, endNode: 1 });
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const plans = await turnRepository.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      expect(plans).not.toEqual(undefined);
      expect(typeof plans[0].l_str).toEqual('string');
      expect(plans[0].lineString.type).toEqual('LineString');
      done();
    });
  });
});
