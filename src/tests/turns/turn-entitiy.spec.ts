import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection, getRepository, Repository } from 'typeorm';
import { Turn } from '../../turns/turn.entity';

describe('# Turn Entity', () => {
  let connection: Connection;
  let repository: Repository<Turn>;
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(Turn),
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
      entities: [Turn],
      synchronize: true,
      dropSchema: true,
      logging: false,
      name: 'testConnection',
    });
    repository = getRepository(Turn, 'testConnection');
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('Create Turn', () => {
    it('Should be able to create turn', async (done) => {
      const turn = new Turn();
      turn.id = 1;
      turn.name = 'lib-test1';
      turn.geom = {
        type: 'LineString',
        coordinates: [[5.516469955, -19.58231926]],
      };
      turn.srid = {
        type: 'LineString',
        coordinates: [[5.516469955, -19.58231926]],
      };
      turn.length = 11.047;
      (turn.fromnode = 203050.0), (turn.tonode = 203073.0);
      const result = await repository.save(turn);
      expect(result.id).toEqual(1);
      expect(result.name).toEqual(turn.name);
      expect(result.geom).toEqual(turn.geom);
      expect(result.srid).toEqual(turn.srid);
      expect(result.length).toEqual(turn.length);
      expect(result.fromnode).toEqual(turn.fromnode);
      expect(result.tonode).toEqual(turn.tonode);
      expect(result.version).toEqual(1);
      done();
    });
  });

  describe('# Get Turn By Id', () => {
    it('Should be able to get turns by id', async (done) => {
      const turn = await repository.findOne({ where: { id: 1 } });
      expect(turn.name).toEqual('lib-test1');
      expect(turn.srid.type).toEqual('LineString');
      expect(turn.srid.coordinates instanceof Array).toEqual(true);
      done();
    });
  });

  describe('# Update Turn By Id', () => {
    it('Should be able to update turn by id', async (done) => {
      const turn = await repository.findOne({ where: { id: 1 } });
      turn.name = 'lib-test2';
      const result = await repository.save(turn);
      expect(result.name).toEqual(turn.name);
      expect(result.version).toEqual(2);
      done();
    });
  });

  describe('# Delete Turn By Id', () => {
    it('Should be able to delete turn by Id', async (done) => {
      const result = await repository.delete({ id: 1 });
      const turn = await repository.findOne({ where: { id: 1 } });
      expect(result.affected).toEqual(1);
      expect(turn).toEqual(undefined);
      done();
    });
  });
});
