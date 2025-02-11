import { Test, TestingModule } from '@nestjs/testing';
import { defineConfig, Entity, EntityManager, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { Filter } from '@/infra/dtos/filter.dto';
import { Pagination } from '@/infra/dtos/pagination.dto';
import { Sort, SortDirection } from '@/infra/dtos/sort.dto';
import { BaseMikroOrmDbRepository, EntityRepository } from '../_base-mikro-orm-db.repository';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { BaseEntity } from '@/infra/persistence/mikro-orm/entities/_base-entity';
import { UuidAdapter } from '@/infra/adapters/uuid.adapter';

@Entity()
class MockEntity extends BaseEntity {
  @PrimaryKey()
  id: string = new UuidAdapter().generate();

  @Property()
  name: string;
}

export const MockEntityRepository = EntityRepository(MockEntity);

describe('MockEntityRepository (unit)', () => {
  let em: EntityManager;
  let mockEntityRepository: BaseMikroOrmDbRepository<MockEntity, MockEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot(
          defineConfig({
            connect: false,
            entities: [MockEntity],
            entitiesTs: [MockEntity],
            dbName: 'test',
            allowGlobalContext: true,
          }),
        ),
      ],
      providers: [
        {
          provide: MockEntityRepository,
          useFactory: (entityManager: EntityManager, mikroOrm: MikroORM) => {
            return new MockEntityRepository(entityManager, mikroOrm);
          },
          inject: [EntityManager, MikroORM],
        },
      ],
    }).compile();

    em = module.get(EntityManager);
    mockEntityRepository = module.get(MockEntityRepository);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(mockEntityRepository).toBeDefined();
  });

  it('should return null if no entity is found by id', async () => {
    jest.spyOn(em, 'findOne').mockResolvedValueOnce(null);
    const entity = await mockEntityRepository.findById('1');
    expect(entity).toBeNull();
  });

  it('should return the entity if an entity with the given id is found', async () => {
    const dbEntity = { id: '1', name: 'Test Entity' };

    jest.spyOn(em, 'findOne').mockImplementationOnce(() => {
      return Promise.resolve(dbEntity);
    });

    const entity = await mockEntityRepository.findById('1');
    expect(entity).toBeDefined();
    expect(entity).toBe(dbEntity);
  });

  it('should return all entities without filters, pagination, or sorting', async () => {
    const dbEntities = [
      { id: 1, name: 'Entity1' },
      { id: 2, name: 'Entity2' },
    ];
    jest.spyOn(em, 'findAndCount').mockResolvedValueOnce([dbEntities, dbEntities.length]);

    const result = await mockEntityRepository.findAll();
    expect(result.items).toEqual(dbEntities);
    expect(result.total).toBe(dbEntities.length);
  });

  it('should apply filters correctly', async () => {
    const filter: Filter = { field: 'name', value: 'Entity1', not: false };
    const dbEntities = [{ id: 1, name: 'Entity1' }];
    jest.spyOn(em, 'findAndCount').mockResolvedValueOnce([dbEntities, dbEntities.length]);

    const result = await mockEntityRepository.findAll([filter]);
    expect(result.items).toEqual(dbEntities);
    expect(result.total).toBe(dbEntities.length);
  });

  it('should apply pagination correctly', async () => {
    const pagination: Pagination = { page: 1, pageSize: 1 };
    const dbEntities = [{ id: 1, name: 'Entity1' }];
    jest.spyOn(em, 'findAndCount').mockResolvedValueOnce([dbEntities, 2]);

    const result = await mockEntityRepository.findAll(undefined, pagination);
    expect(result.items).toEqual(dbEntities);
    expect(result.total).toBe(2);
  });

  it('should apply sorting correctly', async () => {
    const sort: Sort = { field: 'name', direction: SortDirection.ASC };
    const dbEntities = [
      { id: 1, name: 'Entity1' },
      { id: 2, name: 'Entity2' },
    ];
    jest.spyOn(em, 'findAndCount').mockResolvedValueOnce([dbEntities, dbEntities.length]);

    const result = await mockEntityRepository.findAll(undefined, undefined, sort);
    expect(result.items).toEqual(dbEntities);
    expect(result.total).toBe(dbEntities.length);
  });

  it('should check if an entity exists by id', async () => {
    jest.spyOn(em, 'findOne').mockResolvedValueOnce(new MockEntity());
    const exists = await mockEntityRepository.exists('1');
    expect(exists).toBe(true);
  });

  it('should return false if entity does not exist', async () => {
    jest.spyOn(em, 'findOne').mockResolvedValueOnce(null);
    const exists = await mockEntityRepository.exists('1');
    expect(exists).toBe(false);
  });

  it('should check if multiple entities exist by ids', async () => {
    jest.spyOn(em, 'find').mockResolvedValueOnce([new MockEntity(), new MockEntity()]);
    const exists = await mockEntityRepository.allExist(['1', '2']);
    expect(exists).toBe(true);
  });

  it('should return false if not all requested entities exist', async () => {
    jest.spyOn(em, 'find').mockResolvedValueOnce([new MockEntity()]);
    const exists = await mockEntityRepository.allExist(['1', '2']);
    expect(exists).toBe(false);
  });

  it('should delete an entity by id', async () => {
    const entity = new MockEntity();
    const removeAndFlushSpy = jest.spyOn(em, 'removeAndFlush').mockResolvedValueOnce(undefined);
    const getReferenceSpy = jest.spyOn(em, 'getReference').mockReturnValueOnce(entity);

    await mockEntityRepository.delete('1');

    expect(getReferenceSpy).toHaveBeenCalledWith(MockEntity, '1');
    expect(removeAndFlushSpy).toHaveBeenCalledWith(entity);
  });
});
