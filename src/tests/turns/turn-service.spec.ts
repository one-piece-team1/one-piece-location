import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TurnService } from '../../turns/turn.service';
import { TurnRepository } from '../../turns/turn.repository';
import { MockNeaereestNode, MockGenerateRoutesAsText, MockGenerateRoutesAsLine, ISearchForPlanStartandEndPointDto, ISearchRoutePlansDto } from '../../libs/mock';
import * as ELocation from '../../turns/enums';
import * as IShare from '../../interfaces';
import * as ITurn from '../../turns/interfaces';

interface IServerCustomExpcetion {
  status: number;
  error: string;
}

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
      const result = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('Planning not found');
      done();
    });

    it('Should return internal server error when expection is caught', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });

    it('Should be able to get routes planning as text', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const result = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      const resultResponse = result as IShare.IResponseBase<ITurn.INetworkGeometryResponse[]>;
      expect(resultResponse.statusCode).toEqual(200);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsText());
      done();
    });

    it('Should be able to get routes planning as line', async (done: jest.DoneCallback) => {
      mockSearchRoutePlansDto = {
        startNode: 0,
        endNode: 0,
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.getRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const result = await turnService.getRoutesPlanning(mockSearchRoutePlansDto);
      const resultResponse = result as IShare.IResponseBase<ITurn.INetworkGeometryResponse[]>;
      expect(resultResponse.statusCode).toEqual(200);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsLine());
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
      const result = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.NOT_FOUND);
      expect(resultResponse.error).toEqual('Planning not found');
      done();
    });

    it('Should return internal server error when expection is caught', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockRejectedValueOnce(new Error('Internal Server Error'));
      const result = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      const resultResponse = (result as HttpException).getResponse() as IServerCustomExpcetion;
      expect(resultResponse.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(resultResponse.error).toEqual('Internal Server Error');
      done();
    });

    it('Should be able to generate routes planning as text', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.TEXT,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsText());
      const result = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      const resultResponse = result as IShare.IResponseBase<ITurn.INetworkGeometryResponse[]>;
      expect(resultResponse.statusCode).toEqual(200);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsText());
      done();
    });

    it('Should be able to generate routes planning as line', async (done: jest.DoneCallback) => {
      mockSearchForPlanStartandEndPointDto = {
        startLocationName: "ST. MARY'S (SCILLY ISL.)",
        endLocationName: 'MILLHAVEN',
        type: ELocation.EPlanType.LINE,
      };
      turnRepository.generateRoutesPlanning = jest.fn().mockReturnValueOnce(MockGenerateRoutesAsLine());
      const result = await turnService.generateRoutesPlanning(mockSearchForPlanStartandEndPointDto);
      const resultResponse = result as IShare.IResponseBase<ITurn.INetworkGeometryResponse[]>;
      expect(resultResponse.statusCode).toEqual(200);
      expect(resultResponse.status).toEqual('success');
      expect(resultResponse.message as ITurn.INetworkGeometryResponse[]).toEqual(MockGenerateRoutesAsLine());
      done();
    });
  });
});
