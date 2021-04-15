import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getManager } from 'typeorm';
import { Turn } from '../../turns/turn.entity';
import { Location, Country } from '../../locations/relations';
import { TurnRepository } from '../../turns/turn.repository';
import { boostrap } from '../../libs/mock_turn';
import { MockNeaereestNode, MockGenerateRoutesAsText, MockGenerateRoutesAsLine, ISearchForPlanStartandEndPointDto, ISearchRoutePlansDto } from '../../libs/mock';
import * as ELocation from '../../turns/enums';
import * as ITurn from '../../turns/interfaces';
import { testOrmconfig } from '../../config/orm.config';

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
