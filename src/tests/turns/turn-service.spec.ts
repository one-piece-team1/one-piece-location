import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from '../../turns/turn.service';
import { TurnRepository } from '../../turns/turn.repository';
import { MockNeaereestNode, MockGenerateRoutesAsText, MockGenerateRoutesAsLine, ISearchForPlanStartandEndPointDto, ISearchRoutePlansDto } from '../../libs/mock';
import * as ELocation from '../../turns/enums';
import * as ITurn from '../../turns/interfaces';

describe('# Turn Serivce', () => {
  let turnService: TurnService;
  let turnRepository: TurnRepository;

  // mock dto
  let mockSearchForPlanStartandEndPointDto: ISearchForPlanStartandEndPointDto;
  let mockSearchRoutePlansDto: ISearchRoutePlansDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        {
          provide: TurnRepository,
          useValue: {
            getNearestPlanLineString: jest.fn(),
            getRoutesPlanning: jest.fn(),
            generateRoutesPlanning: jest.fn(),
          },
        },
      ],
    }).compile();

    turnRepository = module.get<TurnRepository>(TurnRepository);
    turnService = module.get<TurnService>(TurnService);
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockSearchForPlanStartandEndPointDto = null;
    mockSearchRoutePlansDto = null;
  });

  it('TurnService should be created', () => {
    expect(turnService).toBeDefined();
  });

  describe('# Get Routes Start and End Nodes', () => {
    it('Should be able to get nearest linestring nodes', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
      };
      turnRepository.getNearestPlanLineString = jest.fn().mockReturnValueOnce(MockNeaereestNode());
      const res = await turnService.getRouteStartandEndNodes(mockSearchForPlanStartandEndPointDto);
      expect(res.startNode.id).toEqual(1);
      expect(res.endNode.id).toEqual(2);
      done();
    });
  });

  describe('# Get Routes Planning', () => {
    it('Should return not found custom error when plans not found', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(undefined);
      const res = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      expect(res.statusCode).toEqual(404);
      expect(res.status).toEqual('error');
      expect(res.message).toEqual('Planning not found');
      done();
    });

    it('Should return internal server error when expection is caught', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockRejectedValueOnce('Internal Server Error');
      try {
        await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      } catch (error) {
        expect(error.message).toMatch(/(Internal|Server|Error)/gi);
      }
      done();
    });

    it('Should be able to get routes planning as text', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const res = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      expect(res.statusCode).toEqual(200);
      expect(res.status).toEqual('success');
      expect(res.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsText());
      done();
    });

    it('Should be able to get routes planning as line', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const res = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      expect(res.statusCode).toEqual(200);
      expect(res.status).toEqual('success');
      expect(res.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsLine());
      done();
    });
  });

  describe('# Generate Routes Planning', () => {
    it('Should return not found custom error when plans not found', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockReturnValueOnce(undefined);
      const res = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      expect(res.statusCode).toEqual(404);
      expect(res.status).toEqual('error');
      expect(res.message).toEqual('Planning not found');
      done();
    });

    it('Should return internal server error when expection is caught', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockRejectedValueOnce('Internal Server Error');
      try {
        await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      } catch (error) {
        expect(error.message).toMatch(/(Internal|Server|Error)/gi);
      }
      done();
    });

    it('Should be able to generate routes planning as text', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const res = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      expect(res.statusCode).toEqual(200);
      expect(res.status).toEqual('success');
      expect(res.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsText());
      done();
    });

    it('Should be able to generate routes planning as line', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const res = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      expect(res.statusCode).toEqual(200);
      expect(res.status).toEqual('success');
      expect(res.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsLine());
      done();
    });
  });
});
