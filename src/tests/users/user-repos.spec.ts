import { Test, TestingModule } from '@nestjs/testing';
import { getCustomRepositoryToken } from '@nestjs/typeorm';
import { Connection, createConnection } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../users/user.entity';
import { UserRepository } from '../../users/user.repository';

describe('# User Repository', () => {
  let connection: Connection;
  let userRepository: UserRepository;
  let id: string = '';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getCustomRepositoryToken(UserRepository),
          useClass: UserRepository,
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
      entities: [User],
      synchronize: true,
      dropSchema: true,
      logging: false,
      name: 'testConnection',
    });
    User.useConnection(connection);
    userRepository = await module.get(getCustomRepositoryToken(UserRepository));
  });

  afterAll(async () => {
    await connection.close();
  });

  describe('# Create User', () => {
    it('Should not be able to create user and throw Error', async (done: jest.DoneCallback) => {
      const user = new User();
      user.username = 'test1';
      try {
        await userRepository.createUser(user);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/column "id" violates not-null/gi);
      }
      done();
    });

    it('Should be able to create user and not throw Error', async (done: jest.DoneCallback) => {
      const user = new User();
      id = uuidv4();
      user.id = id;
      user.username = 'unit-test1';
      user.email = 'unit-test1@gmail.com';
      user.password = 'Aabc123';
      user.salt = '123';
      user.expiredDate = new Date();
      const result = await userRepository.createUser(user);
      expect(result.id).toEqual(user.id);
      expect(result.role).toEqual('user');
      expect(result.expiredDate).toEqual(user.expiredDate);
      expect(result.diamondCoin).toEqual(0);
      expect(result.goldCoin).toEqual(10);
      expect(result.username).toEqual(user.username);
      expect(result.email).toEqual(user.email);
      expect(result.password).toEqual(user.password);
      expect(result.salt).toEqual(user.salt);
      expect(user.expiredDate).toEqual(user.expiredDate);
      expect(typeof result.createdAt).not.toEqual(undefined);
      expect(typeof result.updatedAt).not.toEqual(undefined);
      done();
    });
  });

  describe('# Get User By Id', () => {
    it('Should not be able to get User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.getUserById(id, false);
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/Not Found/gi);
      }
      done();
    });

    it('Should be able to find User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.getUserById(id, false);
      expect(user.username).toEqual('unit-test1');
      expect(user.email).toEqual('unit-test1@gmail.com');
      done();
    });
  });

  describe('# Update User Password By', () => {
    it('Should not be able to update User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.updateUserPassword({ id, salt: '123', password: 'Babc123' });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(Cannot set property|of undefined)/gi);
      }
      done();
    });

    it('Should be able to Update User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.updateUserPassword({ id, salt: '123', password: 'Babc123' });
      expect(user.salt).toEqual('123');
      expect(user.password).toEqual('Babc123');
      expect(user.version).toEqual(2);
      done();
    });
  });

  describe('# Soft Delete User By Id', () => {
    it('Should not be able to soft delete User when id is not existed in db', async (done: jest.DoneCallback) => {
      const id = uuidv4();
      try {
        await userRepository.softDeleteUser({ id });
      } catch (error) {
        expect(error).not.toEqual(undefined);
        expect(typeof error.message).toEqual('string');
        expect(error.message).toMatch(/(Cannot set property|of undefined)/gi);
      }
      done();
    });

    it('Should be able to soft delete User when id is valid', async (done: jest.DoneCallback) => {
      const user = await userRepository.softDeleteUser({ id });
      expect(user.status).toEqual(false);
      done();
    });
  });
});
