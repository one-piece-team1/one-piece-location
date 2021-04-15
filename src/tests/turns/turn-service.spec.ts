import { Test, TestingModule } from '@nestjs/testing';
import { TurnService } from '../../turns/turn.service';
import { TurnRepository } from '../../turns/turn.repository';
import * as ELocation from '../../turns/enums';
import * as ITurn from '../../turns/interfaces';

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

function MockNeaereestNode(): ITurn.INearestNodeQueryResponse {
  return {
    startNode: {
      st_distance: 123.9808098,
      id: 1,
      fromnode: 1,
      tonode: 2,
      geometries: '',
    },
    endNode: {
      st_distance: 113.9808098,
      id: 2,
      fromnode: 10,
      tonode: 1,
      geometries: '',
    },
  };
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
