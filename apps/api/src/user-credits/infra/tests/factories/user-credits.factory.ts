import { UserCredit } from '@/core/user-credits/domain/entities/user-credit.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class UserCreditFactory extends Factory<UserCredit> {
  model = UserCredit;

  definition(): Partial<UserCredit> {
    return {
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useUserCreditFactory(data: Partial<RequiredEntityData<UserCredit>>, em: EntityManager): UserCredit {
  return new UserCreditFactory(em).makeOne(data);
}

export async function useDbUserCredit(data: Partial<RequiredEntityData<UserCredit>>, em: EntityManager): Promise<UserCredit> {
  const userCredit = useUserCreditFactory(data, em);
  await em.persistAndFlush(userCredit);
  return userCredit;
} 