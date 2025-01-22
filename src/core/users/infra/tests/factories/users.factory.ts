import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class UserFactory extends Factory<User> {
  model = User;

  definition(): RequiredEntityData<User> {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      clientId: faker.number.int({ min: 1, max: 1000 }),
      credits: faker.number.int({ min: 0, max: 10000 }),
      paymentExternalId: faker.string.uuid(),
      role: faker.helpers.arrayElement([UserRole.ADMIN, UserRole.CUSTOMER]),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useUserFactory(data: Partial<RequiredEntityData<User>>, em: EntityManager): User {
  return new UserFactory(em).makeOne(data);
}

export async function useDbUser(data: Partial<RequiredEntityData<User>>, em: EntityManager): Promise<User> {
  const user = useUserFactory(data, em);
  await em.persistAndFlush(user);
  return user;
}
