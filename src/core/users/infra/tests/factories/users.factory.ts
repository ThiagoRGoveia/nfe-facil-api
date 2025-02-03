import { User, UserRole } from '@/core/users/domain/entities/user.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class UserFactory extends Factory<User> {
  model = User;

  definition(): RequiredEntityData<User> {
    return {
      id: faker.string.uuid(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      clientId: faker.string.uuid(),
      clientSecret: faker.string.alphanumeric(36).toUpperCase(),
      credits: faker.number.int({ min: 0, max: 10000 }),
      paymentExternalId: faker.string.uuid(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement([UserRole.ADMIN, UserRole.CUSTOMER]),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      auth0Id: faker.string.uuid(),
      isSocial: false,
    };
  }
}

export function useUserFactory(override: Partial<RequiredEntityData<User>> = {}, em: EntityManager): User {
  return new UserFactory(em).makeOne(override);
}

export async function useDbUser(data: Partial<RequiredEntityData<User>>, em: EntityManager): Promise<User> {
  const user = useUserFactory(data, em);
  await em.persistAndFlush(user);
  return user;
}
