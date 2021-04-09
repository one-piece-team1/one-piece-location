import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { Turn } from '../../turns/turn.entity';
import { Location } from '../../locations/relations/location.entity';
import { Country } from '../../locations/relations/country.entity';

type TEntity = User | Turn | Location | Country;
export const repositoryMock: MockProxy<Repository<TEntity>> & Repository<TEntity> = mock<Repository<TEntity>>();
export const getConnection = jest.fn().mockReturnValue({
  getRepository: () => repositoryMock,
});
export class BaseEntity {}
export const ObjectIdColumn = () => {};
export const Column = () => {};
export const Index = () => {};
export const CreateDateColumn = () => {};
export const UpdateDateColumn = () => {};
export const Entity = () => {};
