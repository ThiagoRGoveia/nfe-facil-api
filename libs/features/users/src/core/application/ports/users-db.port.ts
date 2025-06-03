import { User } from '../../domain/entities/user.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';
import { RequiredEntityData } from '@mikro-orm/core';

export type DtoWithClientCredentials<T> = T & {
  clientId: string;
  clientSecret: string;
  auth0Id: string;
};

export abstract class UserDbPort extends BaseDbPort<User> {
  abstract create(data: DtoWithClientCredentials<RequiredEntityData<User>>): User;
  abstract update(id: User['id'], data: Partial<DtoWithClientCredentials<RequiredEntityData<User>>>): User;
  abstract findByClientId(clientId: string): Promise<User | null>;
  abstract findByAuth0Id(auth0Id: string): Promise<User | null>;
}
