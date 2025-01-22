import { Client } from '@/core/clients/domain/entities/client.entity';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class ClientFactory extends Factory<Client> {
  model = Client;

  definition(): Partial<Client> {
    return {
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useClientFactory(data: Partial<RequiredEntityData<Client>>, em: EntityManager): Client {
  return new ClientFactory(em).makeOne(data);
}

export async function useDbClient(data: Partial<RequiredEntityData<Client>>, em: EntityManager): Promise<Client> {
  const client = useClientFactory(data, em);
  await em.persistAndFlush(client);
  return client;
}
